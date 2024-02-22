import { CronJob } from "cron";
import { logger } from "../../shared";
import { Qso } from "../qso/models";
import EmailService from "../../email";
import { isDocument } from "@typegoose/typegoose";
import { qrz } from "../qrz";
import User, { UserDoc } from "../auth/models";
import EqslPic from "../eqsl/eqsl";
import { EventDoc } from "../event/models";
import sharp from "sharp";
import { unlink } from "fs/promises";

const limitPerDay = 180;

async function sendEqslEmail() {
    logger.info("Running Cron Job to send EQSL emails");

    let count = 0;

    const hrefsToSend = new Set<string>();
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

            const user = await User.findOne({
                callsign: qso.callsign
            });

            const email = user
                ? user.email
                : await qrz.scrapeEmail(qso.callsign);
            if (!email) {
                logger.warn(
                    `Event ${event.name} QSO ${qso._id} no email found for ${fromStation.callsign}`
                );
                continue;
            }

            if (user) {
                logger.debug(`User ${user.callsign} found for QSO ${qso._id}`);
            } else {
                logger.debug(
                    `No user found for ${qso.callsign}, found QRZ email ${email}`
                );
            }

            let eqslBuff: Buffer | null = null;
            if (!qso.imageHref) {
                const imgFilePath = eqslTemplateImgs.get(event._id.toString());
                if (!imgFilePath) {
                    throw new Error(
                        "No image file path found for event " + event._id
                    );
                }
                const imgBuf = await sharp(imgFilePath).toBuffer();
                const eqslPic = new EqslPic(imgBuf);
                logger.debug(
                    "Adding QSO info to image buffer for QSO " + qso._id
                );
                await eqslPic.addQsoInfo(qso, fromStation, imgFilePath);
                const href = await eqslPic.uploadImage(
                    fromStation._id.toString()
                );
                qso.imageHref = href;
                hrefsToSend.add(href);
                logger.debug(
                    `Uploaded eQSL image to ${href} for QSO ${qso._id}`
                );
                await qso.save();
                eqslBuff = eqslPic.getImage();
            }

            await EmailService.sendEqslEmail(
                qso,
                fromStation,
                email,
                eqslBuff ?? undefined
            );
            qso.emailSent = true;
            qso.emailSentDate = new Date();
            await qso.save();

            logger.info(`Sent eQSL email to ${email} for QSO ${qso._id}`);

            // remove from set
            hrefsToSend.delete(qso.imageHref);

            count++;
        }
    } catch (err) {
        logger.error("Error while sending EQSL emails");
        logger.error(err);
    }

    // delete unused EQSL images
    if (hrefsToSend.size > 0) {
        logger.info(`Deleting ${hrefsToSend.size} unused EQSL images`);
        for (const href of hrefsToSend) {
            const eqslPic = new EqslPic(href);
            try {
                await eqslPic.deleteImage();
            } catch (err) {
                logger.error("Error deleting EQSL image " + href);
                logger.error(err);
            }
        }
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
