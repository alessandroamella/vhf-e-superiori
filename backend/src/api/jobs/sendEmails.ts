import { CronJob } from "cron";
import { logger } from "../../shared";
import { Qso } from "../qso/models";
import EmailService from "../../email";
import { isDocument } from "@typegoose/typegoose";
import { qrz } from "../qrz";
import { UserDoc } from "../auth/models";
import EqslPic from "../eqsl/eqsl";
import { EventDoc } from "../event/models";

const limitPerDay = 180;

export const sendEqslEmail = new CronJob(
    "0 14 * * *",
    async function () {
        logger.info("Running Cron Job to send EQSL emails");

        let count = 0;

        try {
            const qsos = await Qso.find({
                emailSent: false
            })
                .populate("fromStation")
                .populate("event")
                .sort({ createdAt: 1 })
                .exec();

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

                const fromStation = qso.fromStation as UserDoc;
                const email = await qrz.scrapeEmail(fromStation.callsign);
                if (!email) {
                    logger.debug(`No email found for ${fromStation.callsign}`);
                    continue;
                }

                const event = qso.event as EventDoc;
                if (!event.eqslUrl) {
                    logger.debug(`No eQSL URL found for event ${event.name}`);
                    continue;
                }

                let eqslBuff: Buffer | null = null;
                if (!qso.imageHref) {
                    const eqslPic = new EqslPic(event.eqslUrl);
                    logger.debug("Fetching eQSL image");
                    await eqslPic.fetchImage();
                    logger.debug("Adding QSO info to image");
                    await eqslPic.addQsoInfo(qso);
                    const href = await eqslPic.uploadImage(
                        fromStation._id.toString()
                    );
                    qso.imageHref = href;
                    logger.debug("Updating QSO with EQSL image");
                    await qso.save();
                    eqslBuff = eqslPic.getImage();
                }

                await EmailService.sendEqslEmail(
                    qso,
                    fromStation,
                    email,
                    eqslBuff ?? undefined
                );
                count++;
            }
        } catch (err) {
            logger.error("Error while sending EQSL emails");
            logger.error(err);
        }

        logger.info("Cron Job to send EQSL emails completed");
    },
    null,
    false,
    "Europe/Rome"
);
