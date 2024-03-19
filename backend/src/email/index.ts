import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import { UserDoc } from "../api/auth/models";
import { EventDoc } from "../api/event/models";
import { JoinRequestDoc } from "../api/joinRequest/models";
import { envs, logger } from "../shared";
import { CommentDoc } from "../api/comment/models";
import { BasePostDoc } from "../api/post/models";
import { qrz } from "../api/qrz";
import { QsoDoc } from "../api/qso/models";
import EqslPic from "../api/eqsl/eqsl";
import { readFile, unlink } from "fs/promises";
import path from "path";
import moment from "moment-timezone";

moment.locale("it");

export class EmailService {
    private static transporter: nodemailer.Transporter | null = null;

    private static adminEmails = Array.from(
        Array(parseInt(envs.TOT_ADMIN_EMAILS)).keys()
    ).map(i => process.env[`ADMIN_EMAIL_${i}`] as string);

    private static async loadMailFromFile(name: string, ...params: string[]) {
        const text = await readFile(path.join(process.cwd(), "emails", name), {
            encoding: "utf-8"
        });
        // replace {0}, {1}, ... with params
        return params.reduce(
            (acc, param, i) =>
                acc.replace(new RegExp(`\\{${i}\\}`, "g"), param),
            text
        );
    }

    private static _initialize(): Promise<void> {
        return new Promise((resolve, reject) => {
            EmailService.transporter = nodemailer.createTransport({
                host: envs.MAIL_SERVER,
                auth: {
                    user: envs.MAIL_USERNAME,
                    pass: envs.MAIL_PASSWORD
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            EmailService.transporter.verify((err, success): void => {
                if (err) {
                    logger.error(err);
                    return reject(err);
                }
                logger.info("Email ready: " + success);
                return resolve();
            });
        });
    }

    public static async sendMail(message: Mail.Options): Promise<void> {
        if (!EmailService.transporter) {
            await EmailService._initialize();
        }
        return new Promise((resolve, reject) => {
            if (!EmailService.transporter) {
                logger.error("EmailService.transporter null in sendMail");
                return reject("EmailService.transporter null");
            }
            EmailService.transporter.sendMail(message, err => {
                if (err) {
                    logger.error("Error while sending email");
                    logger.error(err);
                    return reject(err);
                }
                return resolve();
            });
        });
    }

    public static async sendResetPwMail(user: UserDoc, code: string) {
        const html = await EmailService.loadMailFromFile(
            "changePw.html",
            user.callsign,
            user._id.toString(),
            code
        );
        const message: Mail.Options = {
            from: `"VHF e superiori" ${process.env.SEND_EMAIL_FROM}`,
            to: user.email,
            subject: "Reset password",
            html
        };

        await EmailService.sendMail(message);
        logger.info("Verify user mail sent to user " + user.callsign);
    }

    public static async sendVerifyMail(
        user: UserDoc,
        code: string,
        isNewUser: boolean
    ) {
        logger.debug(
            "Sending verify mail to " + user.email + " with code: " + code
        );
        const html = await EmailService.loadMailFromFile(
            "verifyEmail.html",
            user.callsign,
            isNewUser ? "registrazione" : "cambio email",
            user._id.toString(),
            code
        );
        const message: Mail.Options = {
            from: `"VHF e superiori" ${process.env.SEND_EMAIL_FROM}`,
            to: user.email,
            subject: "Verifica email VHF e superiori",
            html
        };

        await EmailService.sendMail(message);
        logger.info("Verify user mail sent to user " + user.callsign);
    }

    public static async sendJoinRequestMail(
        joinRequest: JoinRequestDoc,
        event: EventDoc,
        user: UserDoc
    ) {
        const html = await EmailService.loadMailFromFile(
            "requestStation.html",
            user.callsign,
            event.name,
            moment(event.date)
                .tz("Europe/Rome")
                .format("dddd D MMMM Y [alle] HH:mm")
        );

        const message: Mail.Options = {
            from: `"VHF e superiori" ${process.env.SEND_EMAIL_FROM}`,
            to: user.email,
            subject: "Richiesta per stazione attivatrice",
            html
        };

        await EmailService.sendMail(message);
        logger.info("Join request mail sent to user " + user.callsign);
    }

    public static async sendAcceptJoinRequestMail(
        joinRequest: JoinRequestDoc,
        event: EventDoc,
        user: UserDoc
    ) {
        const html = await EmailService.loadMailFromFile(
            "acceptedStation.html",
            user.callsign,
            event.name,
            moment(event.date)
                .tz("Europe/Rome")
                .format("dddd D MMMM Y [alle] HH:mm")
        );

        const message: Mail.Options = {
            from: `"VHF e superiori" ${process.env.SEND_EMAIL_FROM}`,
            to: user.email,
            subject: "Accettazione richiesta stazione attivatrice",
            html
        };

        await EmailService.sendMail(message);
        logger.info("Join request mail sent to user " + user.callsign);
    }

    public static async sendAdminJoinRequestMail(
        joinRequest: JoinRequestDoc,
        event: EventDoc,
        user: UserDoc
    ) {
        logger.debug("Sending emails to admins");
        logger.debug(EmailService.adminEmails);

        const message: Mail.Options = {
            from: `"VHF e superiori" ${process.env.SEND_EMAIL_FROM}`,
            to: EmailService.adminEmails,
            subject: "Richiesta per stazione attivatrice",
            html:
                "<p>Ciao amministratore, l'utente " +
                user.name +
                ' <span style="font-weight: 600">' +
                user.callsign +
                "</span>, ha richiesto di partecipare come " +
                'stazione attivatrice all\'evento <span style="font-weight: 600">' +
                event.name +
                '</span> con l\'antenna "<span style="font-style: italic">' +
                joinRequest.antenna +
                '</span>"<br />' +
                'La richiesta è attualmente <span style="font-weight: 600">in attesa</span>.<br />' +
                'Puoi ricontattare l\'utente al numero <span style="font-weight: 600">' +
                user.phoneNumber +
                "</span>.<br />" +
                "Se intendi accettare la richiesta, usa il modulo nel pannello amministratori " +
                '<a href="https://www.vhfesuperiori.eu/eventmanager">vhfesuperiori.eu/eventmanager</a>.</p>'
        };

        await EmailService.sendMail(message);
        logger.info(
            "Join request mail sent to admin for user " + user.callsign
        );
    }

    /*
     * @description Comment must have fromUser and forPost populated!!
     * @param forUser User to send the mail to
     * @param fromUser User who sent the message
     */
    public static async sendCommentMail(
        fromUser: UserDoc,
        forUser: UserDoc,
        post: BasePostDoc,
        comment: CommentDoc
    ) {
        const message: Mail.Options = {
            from: `"VHF e superiori" ${process.env.SEND_EMAIL_FROM}`,
            to: fromUser.email,
            subject: `Nuovo commento da ${fromUser.callsign} al tuo post`,
            html:
                "<p>Ciao " +
                forUser.name +
                ' <span style="font-weight: 600">' +
                forUser.callsign +
                "</span>, l'utente " +
                fromUser.name +
                ' <span style="font-weight: 600">' +
                fromUser.callsign +
                '</span> ha commentato il tuo post <span style="font-weight: 600">' +
                post.description +
                "</span>.<br />" +
                // add card with comment
                '<div style="padding: 1rem; border: 1px solid #ccc; border-radius: 0.5rem; margin-top: 1rem; margin-bottom: 1rem">' +
                '<div style="display: flex; align-items: center; margin-bottom: 1rem">' +
                '<img src="' +
                (await qrz.scrapeProfilePicture(fromUser.callsign)) +
                '" style="width: 3rem; height: 3rem; border-radius: 50%; margin-right: 1rem" />' +
                '<span style="font-weight: 600">' +
                fromUser.callsign +
                "</span>" +
                "</div>" +
                '<div style="margin-bottom: 1rem">' +
                comment.content +
                "</div>" +
                "</div>" +
                // end card with comment
                'Puoi vedere il tuo post <a href="https://www.vhfesuperiori.eu/social/' +
                post._id +
                "#comment-" +
                comment._id +
                '">qui</a>.<br />' +
                'Buona giornata da <a href="https://www.vhfesuperiori.eu">vhfesuperiori.eu</a>!</p>'
        };

        await EmailService.sendMail(message);
        logger.info("Comment mail sent to user " + fromUser.callsign);
    }

    // allega immagine in qso.imageHref
    public static async sendEqslEmail(
        qso: QsoDoc,
        fromStation: UserDoc,
        toEmail: string,
        eqslBuffer?: Buffer
    ) {
        if (!qso.imageHref) {
            throw new Error("Qso has no imageHref");
        }
        logger.debug(
            "Sending eQSL email to " +
                toEmail +
                " with imageHref: " +
                qso.imageHref
        );
        const eqslPic = new EqslPic(qso.imageHref);
        await eqslPic.fetchImage(eqslBuffer);
        const filePath = await eqslPic.saveImageToFile();
        const callsignAlphanum = qso.callsign
            .replace(/[^a-zA-Z0-9]/g, "")
            .toLowerCase();
        const message: Mail.Options = {
            from: `"VHF e superiori" ${process.env.SEND_EMAIL_FROM}`,
            to: toEmail,
            subject: "eQSL per il QSO con " + fromStation.callsign,
            html:
                '<p>Ciao <span style="font-weight: 600">' +
                qso.callsign +
                '</span>, ecco la tua eQSL per il QSO con <span style="font-weight: 600">' +
                fromStation.callsign +
                "</span>!<br />" +
                'Puoi vedere il tuo QSO <a href="https://www.vhfesuperiori.eu/eqsl/' +
                qso._id +
                '">qui</a> e la classifica <a href="https://www.vhfesuperiori.eu/rankings/' +
                (qso.event._id || qso.event) +
                '">qui</a>.<br />' +
                'Grazie per aver partecipato all\'evento e buona giornata da <a href="https://www.vhfesuperiori.eu">vhfesuperiori.eu</a>!</p>',
            attachments: [
                {
                    filename: `eqsl_${callsignAlphanum}.png`,
                    path: filePath
                }
            ]
        };

        await EmailService.sendMail(message);
        logger.info(
            "eQSL mail sent to user " + qso.callsign + " at mail " + toEmail
        );
        await unlink(filePath);
    }
}

export default EmailService;
