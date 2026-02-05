import { unlink } from "node:fs/promises";
import { isDocument } from "@typegoose/typegoose";
import { CronJob } from "cron";
import { subWeeks } from "date-fns";
import { convert as convertHtmlToText } from "html-to-text";
import moment from "moment";
import NodeCache from "node-cache";
import { envs, logger } from "../../shared";
import type { UserDoc } from "../auth/models";
import EmailService, { BatchQsoData } from "../email";
import EqslPic from "../eqsl/eqsl";
import type { EventDoc } from "../event/models";
import { FailedNotificationLog } from "../failedNotificationLog/models";
import { qrz } from "../qrz";
import { Qso, QsoDoc } from "../qso/models";
import { telegramService } from "../telegram/telegram.service";

const LIMIT_PER_DAY = 180;
const CRON_SCHEDULE = "00 13 * * *";
const TIMEZONE = "Europe/Rome";
const MAX_ATTACHMENTS_PER_EMAIL = 3;

interface QsoGroup {
  email: string;
  items: {
    qso: QsoDoc;
    event: EventDoc;
  }[];
}

// Cache for email lookups (30 minutes TTL)
const emailCache = new NodeCache({ stdTTL: 1800 });

async function getEmailForQso(qso: QsoDoc): Promise<string | null> {
  if (qso.email) {
    return qso.email;
  }

  // get the longest part of the callsign (in case of slashes)
  // e.g. "F/IU4QSG/P" -> "IU4QSG"
  const callsign =
    qso.callsign.split("/").sort((a, b) => {
      // sort by length
      return b.length - a.length;
    })[0] || qso.callsign;

  // Check cache first
  const cacheKey = `email:${callsign}`;
  if (emailCache.has(cacheKey)) {
    const cachedEmail = emailCache.get<string | null>(cacheKey);
    logger.debug(
      `Using cached email for ${callsign}: ${cachedEmail || "not found"}`,
    );
    return cachedEmail || null;
  }

  const qrzInfo = await qrz.getInfo(callsign);

  if (qrzInfo?.email) {
    // Update the QSO with the email from QRZ
    qso.email = qrzInfo.email;
    await qso.save();
    // Cache the found email
    emailCache.set(cacheKey, qrzInfo.email);
    return qrzInfo.email;
  }

  // Cache the fact that no email was found
  emailCache.set(cacheKey, null);
  return null;
}

async function sendEqslEmail(): Promise<void> {
  logger.info("Running Cron Job to send EQSL emails (Batch Mode)");

  const eqslTemplateImgs = new Map<string, string>(); // EventID -> Local Path
  const qsoGroups = new Map<string, QsoGroup>(); // Email -> Group

  try {
    const twoWeeksAgo = subWeeks(new Date(), 2);

    // 1. Fetch pending QSOs
    const qsos = await Qso.find({
      emailSent: false,
      createdAt: { $gte: twoWeeksAgo },
    })
      .populate("fromStation")
      .populate("event")
      .sort({ createdAt: -1 })
      .limit(LIMIT_PER_DAY)
      .exec();

    if (qsos.length === 0) {
      logger.info("No QSOs found to process.");
      return;
    }

    logger.info(`Found ${qsos.length} QSOs to process. Grouping by email...`);

    // 2. Group by Recipient Email
    for (const qso of qsos) {
      if (!isDocument(qso.fromStation) || !isDocument(qso.event)) continue;

      const event = qso.event as EventDoc;
      if (!event.eqslUrl) {
        logger.debug(`Event ${event.name} has no eQSL URL, skipping.`);
        continue;
      }

      const email = await getEmailForQso(qso);

      if (!email) {
        // Log failure and notify admins once per event/callsign
        try {
          await FailedNotificationLog.create({
            callsign: qso.callsign,
            eventId: event._id.toString(),
            eventName: event.name,
          });

          const msg = `⚠️ <b>Nessuna Email Trovata</b>\n\nNominativo: <b>${convertHtmlToText(qso.callsign)}</b>\nEvento: <b>${convertHtmlToText(event.name)}</b>`;
          await telegramService.sendAdminNotification(
            msg,
            envs.TELEGRAM_ERRORS_THREAD_ID,
          );
          // biome-ignore lint/suspicious/noExplicitAny: using any to check error properties
        } catch (e: any) {
          if (e.code !== 11000)
            logger.error("Error creating FailedNotificationLog", e);
        }
        continue;
      }

      if (!qsoGroups.has(email)) {
        qsoGroups.set(email, { email, items: [] });
      }
      qsoGroups.get(email)!.items.push({ qso, event });
    }

    // 3. Process each Email Group
    for (const [email, group] of qsoGroups) {
      const batchData: Array<BatchQsoData & { fromStation: string }> = [];
      const attachments: { filename: string; path: string }[] = [];
      const qsosToUpdate: QsoDoc[] = [];

      for (const { qso, event } of group.items) {
        if (!event.eqslUrl) {
          logger.warn(`Event ${event.name} has no eQSL URL, skipping.`);
          continue;
        }

        try {
          // A. Ensure Event Template is downloaded locally (cached for this cron run)
          const eventId = event._id.toString();
          if (!eqslTemplateImgs.has(eventId)) {
            const eqslPic = new EqslPic(event.eqslUrl);
            await eqslPic.fetchImage();
            const tempPath = await eqslPic.saveImageToFile(undefined, "png");
            eqslTemplateImgs.set(eventId, tempPath);
          }

          // B. Generate the final eQSL Image (with text overlay)
          const href = await qso.generateEqsl(
            event,
            event.eqslUrl,
            eqslTemplateImgs.get(eventId)!,
          );

          // C. Prepare metadata for the EJS template
          batchData.push({
            callsign: qso.callsign,
            date: moment(qso.qsoDate).tz("Europe/Rome").format("DD/MM/YYYY"),
            time: moment(qso.qsoDate).tz("Europe/Rome").format("HH:mm"),
            band: qso.band,
            mode: qso.mode,
            eventName: event.name,
            imageHref: href,
            fromStation:
              qso.fromStationCallsignOverride ||
              (qso.fromStation as UserDoc).callsign,
          });

          qsosToUpdate.push(qso);

          // D. Prepare physical attachments (Limited to avoid huge emails)
          if (attachments.length < MAX_ATTACHMENTS_PER_EMAIL) {
            const specificEqsl = new EqslPic(href);
            await specificEqsl.fetchImage();
            const attPath = await specificEqsl.saveImageToFile(
              undefined,
              "jpeg",
            );

            attachments.push({
              filename: `eqsl_${qso.callsign.replace(/[^a-zA-Z0-9]/g, "")}_${qsosToUpdate.length}.jpg`,
              path: attPath,
            });
          }
        } catch (err) {
          logger.error(`Error processing individual QSO ${qso._id} for batch`);
          logger.error(err);
        }
      }

      // 4. Send the consolidated email
      if (batchData.length > 0) {
        try {
          await EmailService.sendEqslBatchEmail(email, batchData, attachments);

          // Mark all processed QSOs as sent
          for (const q of qsosToUpdate) {
            q.emailSent = true;
            q.emailSentDate = new Date();
            await q.save();
          }
          logger.info(
            `Successfully sent batch of ${batchData.length} eQSLs to ${email}`,
          );
        } catch (err) {
          if (EmailService.isQuotaError(err)) {
            logger.error(
              "!!! MAILJET LIMIT REACHED !!! Aborting cron job to save remaining QSOs for tomorrow.",
            );
            logger.error(err);

            // Critical: break the outer group loop so we don't try to send more
            // and we don't mark the current 'qsosToUpdate' as sent.
            break;
          } else {
            logger.error(
              `Failed to send batch email to ${email} (Non-quota error)`,
            );
            logger.error(err);
          }
        }
      }

      // 5. Cleanup individual attachment files immediately after sending
      for (const att of attachments) {
        try {
          await unlink(att.path);
        } catch (e) {
          logger.warn(
            `Cleanup failed for ${att.path}: ${e instanceof Error ? e.message : String(e)}`,
          );
        }
      }
    }
  } catch (err) {
    logger.error("Global error in sendEqslEmail Cron Job");
    logger.error(err);
  } finally {
    // 6. Final cleanup of base event templates
    for (const [id, tempPath] of eqslTemplateImgs) {
      try {
        await unlink(tempPath);
        logger.debug(`Cleaned up template for event ${id}`);
      } catch (e) {
        logger.error(
          `Failed to clean up template at ${tempPath}: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
  }

  logger.info("Cron Job to send EQSL emails completed");
}

export const sendEqslEmailJob = new CronJob(
  CRON_SCHEDULE,
  sendEqslEmail,
  null,
  false,
  TIMEZONE,
);
