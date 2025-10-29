import { unlink } from "node:fs/promises";
import { isDocument } from "@typegoose/typegoose";
import { CronJob } from "cron";
import { subWeeks } from "date-fns";
import { convert as convertHtmlToText } from "html-to-text";
import NodeCache from "node-cache";
import { envs, logger } from "../../shared";
import EqslPic from "../eqsl/eqsl";
import type { EventDoc } from "../event/models";
import { FailedNotificationLog } from "../failedNotificationLog/models";
import { qrz } from "../qrz";
import { Qso, QsoDoc } from "../qso/models";
import { telegramService } from "../telegram/telegram.service";

const LIMIT_PER_DAY = 180;
const CRON_SCHEDULE = "00 13 * * *";
const TIMEZONE = "Europe/Rome";

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

async function processQso(
  qso: QsoDoc,
  event: EventDoc,
  eqslTemplateImgPath: string,
): Promise<void> {
  const email = await getEmailForQso(qso);
  if (!email) {
    logger.warn(
      `No email found for QSO ${qso._id} with callsign ${qso.callsign}`,
    );

    // --- NUOVA LOGICA DI NOTIFICA ---
    try {
      // 1. Prova a creare un log. Se esiste già, fallirà grazie all'indice univoco.
      await FailedNotificationLog.create({
        callsign: qso.callsign,
        eventId: event._id.toString(),
        eventName: event.name,
      });

      // 2. Se la creazione ha successo, significa che è la prima volta. Invia la notifica.
      logger.info(
        `First time no email found for ${qso.callsign} in event ${event.name}. Notifying admins.`,
      );

      const message = `⚠️ <b>Nessuna Email Trovata</b>\n\nNon è stato possibile trovare un indirizzo email per il nominativo <b>${convertHtmlToText(qso.callsign)}</b> durante l'evento <b>${convertHtmlToText(event.name)}</b>.\n\nQuesto avviso non verrà ripetuto per la stessa combinazione nominativo/evento.`;

      await telegramService.sendAdminNotification(
        message,
        envs.TELEGRAM_ERRORS_THREAD_ID,
      );
    } catch (error) {
      // Se l'errore è un "duplicate key error" (codice 11000), è normale.
      // Significa che abbiamo già notificato e non dobbiamo fare nulla.
      if (
        typeof error === "object" &&
        "code" in (error as object) &&
        (error as { code: number }).code === 11000
      ) {
        logger.debug(
          `Admin notification for ${qso.callsign}/${event.name} already sent. Skipping.`,
        );
      } else {
        // Altri errori (es. problemi di connessione al DB) vanno loggati.
        logger.error(
          `Error while checking/creating failed notification log for ${qso.callsign}`,
        );
        logger.error(error);
      }
    }
    // --- FINE NUOVA LOGICA ---

    return;
  } else if (!event.eqslUrl) {
    logger.warn(`No eQSL URL found for event ${event.name}`);
    return;
  }

  try {
    await qso.sendEqsl(event, event.eqslUrl, eqslTemplateImgPath);
    logger.info(`Sent eQSL email to ${email} for QSO ${qso._id}`);
  } catch (err) {
    logger.error(`Error sending eQSL email for QSO ${qso._id} to ${email}`);
    logger.error(err);
  }
}

async function sendEqslEmail(): Promise<void> {
  logger.info("Running Cron Job to send EQSL emails");

  const eqslTemplateImgs = new Map<string, string>();

  try {
    const twoWeeksAgo = subWeeks(new Date(), 2);

    const qsos = await Qso.find({
      emailSent: false,
      createdAt: { $gte: twoWeeksAgo }, // created 2 weeks ago onwards
    })
      .populate("fromStation")
      .populate("event")
      .sort({ createdAt: -1 }) // process the most recent QSOs first
      .limit(LIMIT_PER_DAY)
      .exec();

    logger.info(
      `Found ${qsos.length} QSOs to process (created >= 2 weeks ago)`,
    );

    if (
      qsos.some((qso) => !isDocument(qso.fromStation) || !isDocument(qso.event))
    ) {
      throw new Error("Some QSOs have unpopulated fromStation or event");
    }

    for (const qso of qsos) {
      const event = qso.event as EventDoc;
      if (!event.eqslUrl) {
        logger.debug(`No eQSL URL found for event ${event.name}`);
        continue;
      }

      if (!eqslTemplateImgs.has(event._id.toString())) {
        const eqslPic = new EqslPic(event.eqslUrl);
        await eqslPic.fetchImage();
        const tempPath = await eqslPic.saveImageToFile(undefined, "png"); // Keep PNG for template processing
        eqslTemplateImgs.set(event._id.toString(), tempPath);
      }

      await processQso(qso, event, eqslTemplateImgs.get(event._id.toString())!);
    }
  } catch (err) {
    logger.error("Error while sending EQSL emails");
    logger.error(err);
  } finally {
    // Clean up temp files
    for (const [, tempPath] of eqslTemplateImgs) {
      try {
        await unlink(tempPath);
        logger.debug(`Deleted temp eQSL template image: ${tempPath}`);
      } catch (err) {
        logger.error(`Error deleting temp eQSL template image: ${tempPath}`);
        logger.error(err);
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
