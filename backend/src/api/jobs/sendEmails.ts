import { unlink } from "node:fs/promises";
import { isDocument } from "@typegoose/typegoose";
import { CronJob } from "cron";
import { logger } from "../../shared";
import EqslPic from "../eqsl/eqsl";
import type { EventDoc } from "../event/models";
import { qrz } from "../qrz";
import { Qso, QsoDoc } from "../qso/models";

const LIMIT_PER_DAY = 180;
const CRON_SCHEDULE = "00 13 * * *";
const TIMEZONE = "Europe/Rome";

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
  const qrzInfo = await qrz.getInfo(callsign);

  if (qrzInfo?.email) {
    // Update the QSO with the email from QRZ
    qso.email = qrzInfo.email;
    await qso.save();
    return qrzInfo.email;
  }

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
    const qsos = await Qso.find({ emailSent: false })
      .populate("fromStation")
      .populate("event")
      .sort({ createdAt: -1 }) // process the most recent QSOs first
      .limit(LIMIT_PER_DAY)
      .exec();

    logger.info(`Found ${qsos.length} QSOs to process`);

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
        const tempPath = await eqslPic.saveImageToFile();
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
