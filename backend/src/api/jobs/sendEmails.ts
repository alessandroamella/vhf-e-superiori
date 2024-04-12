import { CronJob } from "cron";
import { logger } from "../../shared";
import { Qso } from "../qso/models";
import { isDocument } from "@typegoose/typegoose";
import { qrz } from "../qrz";
import { User, UserDoc } from "../auth/models";
import EqslPic from "../eqsl/eqsl";
import { EventDoc } from "../event/models";
import { unlink } from "fs/promises";

const limitPerDay = 180;

async function sendEqslEmail() {
    logger.info("Running Cron Job to send EQSL emails");

    let count = 0;

    const eqslTemplateImgs = new Map<string, string>(); // event id -> temp file path of eqsl template

    try {
        const qsos = await Qso.find({
            emailSent: false
        })
            .populate("fromStation")
            .populate("event")
            .sort({ createdAt: 1 })
            .exec();

        logger.info(`Found ${qsos.length} QSOs to send`);

        if (qsos.some(qso => !isDocument(qso.fromStation))) {
            throw new Error("Some QSOs fromStation not populated");
        }
        if (qsos.some(qso => !isDocument(qso.event))) {
            throw new Error("Some QSOs event not populated");
        }

        for (const qso of qsos) {
            if (count >= limitPerDay) {
                logger.info("Limit of " + limitPerDay + " emails reached");
                break;
            }

            const event = qso.event as EventDoc;
            if (!event.eqslUrl) {
                logger.debug(`No eQSL URL found for event ${event.name}`);
                continue;
            }
            // push to eqslTemplateImgs
            if (!eqslTemplateImgs.has(event._id.toString())) {
                const eqslPic = new EqslPic(event.eqslUrl);
                logger.debug("Fetching eQSL template image");
                await eqslPic.fetchImage();
                const tempPath = await eqslPic.saveImageToFile();
                eqslTemplateImgs.set(event._id.toString(), tempPath);
            }

            const fromStation = qso.fromStation as UserDoc;

            // if callsign has prefix or suffix, get the longest one
            const _callsigns = qso.callsign.split("/");
            _callsigns.sort((a, b) => b.length - a.length);
            const callsignClean = _callsigns[0];

            const user = await User.findOne(
                qso.fromStation
                    ? { _id: qso.fromStation }
                    : {
                          callsign: callsignClean
                      }
            );

            const email = user
                ? user.email
                : (await qrz.getInfo(callsignClean))?.email;
            if (!email) {
                logger.warn(
                    `Event ${event.name} QSO ${qso._id} no email found for ${fromStation.callsign}`
                );
                continue;
            }

            if (user) {
                qso.toStation = user._id;
            }
            qso.email = email;
            await qso.save();

            if (user) {
                logger.debug(`User ${user.callsign} found for QSO ${qso._id}`);
            } else {
                logger.debug(
                    `No user found for ${callsignClean}, found QRZ email ${email}`
                );
            }

            try {
                await qso.sendEqsl(
                    event,
                    event.eqslUrl,
                    eqslTemplateImgs.get(event._id.toString())
                );
                logger.info(`Sent eQSL email to ${email} for QSO ${qso._id}`);
            } catch (err) {
                logger.error(
                    "Error while sending EQSL email for QSO " + qso._id
                );
                logger.error(err);
                continue;
            }

            count++;
        }
    } catch (err) {
        logger.error("Error while sending EQSL emails");
        logger.error(err);
    }

    // delete temp files
    for (const [, tempPath] of eqslTemplateImgs) {
        try {
            logger.debug("Deleting temp eQSL template image " + tempPath);
            await unlink(tempPath);
        } catch (err) {
            logger.error("Error deleting temp eQSL template image " + tempPath);
            logger.error(err);
        }
    }

    logger.info("Cron Job to send EQSL emails completed");
}

export const sendEqslEmailJob = new CronJob(
    "00 13 * * *",
    sendEqslEmail,
    null,
    false,
    "Europe/Rome"
);
