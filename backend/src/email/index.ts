import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import { UserDoc } from "../api/auth/models";
import { EventDoc } from "../api/event/models";
import { JoinRequestDoc } from "../api/joinRequest/models";
import { envs, logger } from "../shared";
import { formatInTimeZone } from "date-fns-tz";
import { it } from "date-fns/locale";
import { CommentDoc } from "../api/comment/models";
import { BasePostDoc } from "../api/post/models";
import { qrz } from "../api/qrz";
import { QsoDoc } from "../api/qso/models";
import EqslPic from "../api/eqsl/eqsl";
import { unlink } from "fs/promises";

export class EmailService {
    private static transporter: nodemailer.Transporter | null = null;

    private static adminEmails = Array.from(
        Array(parseInt(envs.TOT_ADMIN_EMAILS)).keys()
    ).map(i => process.env[`ADMIN_EMAIL_${i}`] as string);

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
        const message: Mail.Options = {
            from: `"VHF e superiori" ${process.env.SEND_EMAIL_FROM}`,
            to: user.email,
            subject: "Reset password",
            html:
                "<p>Ciao " +
                user.name +
                ' <span style="font-weight: 600">' +
                user.callsign +
                "</span>, abbiamo ricevuto la tua richiesta di reset della password.<br />" +
                'Se non sei stato tu, faccelo sapere ad <a style="text-decoration: none;" href="mailto:alexlife@tiscali.it">alexlife@tiscali.it</a>, altrimenti<br />' +
                `<br /><span style="margin-top: 1rem; margin-bottom: 1rem; font-size: 1.2rem">Altrimenti, procedi alla verifica del tuo account <a href="https://www.vhfesuperiori.eu/resetpw?user=${user._id}&code=${code}&callsign=${user.callsign}" style="font-weight: 800">cliccando qui</a>.</span><br /><br />` +
                'Buona giornata da <a style="text-decoration: none;" href="https://www.vhfesuperiori.eu">www.vhfesuperiori.eu</a>!</p>'
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
        const message: Mail.Options = {
            from: `"VHF e superiori" ${process.env.SEND_EMAIL_FROM}`,
            to: user.email,
            subject: "Verifica account",
            html:
                "<p>Ciao " +
                user.name +
                ' <span style="font-weight: 600">' +
                user.callsign +
                "</span>, abbiamo ricevuto la tua richiesta di " +
                (isNewUser ? "registrazione" : "cambio email") +
                '.<br />Se non sei stato tu, faccelo sapere ad <a style="text-decoration: none;" href="mailto:alexlife@tiscali.it">alexlife@tiscali.it</a>, altrimenti<br />' +
                `<br /><span style="margin-top: 1rem; margin-bottom: 1rem; font-size: 1.2rem">procedi alla verifica del tuo account <a href="https://www.vhfesuperiori.eu/api/auth/verify/${user._id}/${code}" style="font-weight: 800">cliccando qui</a>.</span><br /><br />` +
                'Buona giornata da <a style="text-decoration: none;" href="https://www.vhfesuperiori.eu">www.vhfesuperiori.eu</a>!</p>'
        };

        await EmailService.sendMail(message);
        logger.info("Verify user mail sent to user " + user.callsign);
    }

    public static async sendJoinRequestMail(
        joinRequest: JoinRequestDoc,
        event: EventDoc,
        user: UserDoc
    ) {
        const message: Mail.Options = {
            from: `"VHF e superiori" ${process.env.SEND_EMAIL_FROM}`,
            to: user.email,
            subject: "Richiesta per stazione attivatrice",
            html:
                "<p>Ciao " +
                user.name +
                ' <span style="font-weight: 600">' +
                user.callsign +
                "</span>, hai richiesto di partecipare come " +
                'stazione attivatrice all\'evento <span style="font-weight: 600">' +
                event.name +
                '</span> con l\'antenna "<span style="font-style: italic">' +
                joinRequest.antenna +
                '</span>"<br />' +
                'La tua richiesta è attualmente <span style="font-weight: 600">in attesa</span>.<br />' +
                'Potrai essere ricontattato nei giorni a seguire al numero indicato durante la registrazione (<span style="font-weight: 600">' +
                user.phoneNumber +
                "</span>) da un amministratore.<br />" +
                'Buona giornata da <a href="https://www.vhfesuperiori.eu">www.vhfesuperiori.eu</a>!</p>'
        };

        await EmailService.sendMail(message);
        logger.info("Join request mail sent to user " + user.callsign);
    }

    public static async sendAcceptJoinRequestMail(
        joinRequest: JoinRequestDoc,
        event: EventDoc,
        user: UserDoc
    ) {
        const message: Mail.Options = {
            from: `"VHF e superiori" ${process.env.SEND_EMAIL_FROM}`,
            to: user.email,
            subject: "Accettazione richiesta stazione attivatrice",
            html:
                "<p>Ciao " +
                user.name +
                ' <span style="font-weight: 600">' +
                user.callsign +
                "</span>, hai richiesto di partecipare come " +
                'stazione attivatrice all\'evento <span style="font-weight: 600">' +
                event.name +
                '</span> con l\'antenna "<span style="font-style: italic">' +
                joinRequest.antenna +
                '</span>"<br />' +
                'La tua richiesta è stata <span style="font-weight: 600">accettata</span>! 🎉🎉<br />' +
                'Ricordati di essere presente durante l\'evento <span style="font-weight: 600">' +
                formatInTimeZone(
                    new Date(event.date),
                    "Europe/Rome",
                    "eeee d MMMM Y",
                    {
                        locale: it
                    }
                ) +
                '</span> alle ore <span style="font-weight: 600">' +
                formatInTimeZone(new Date(event.date), "Europe/Rome", "HH:mm", {
                    locale: it
                }) +
                "</span>.<br />" +
                'Buona giornata da <a href="https://www.vhfesuperiori.eu">www.vhfesuperiori.eu</a>!</p>'
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
                'Buona giornata da <a href="https://www.vhfesuperiori.eu">www.vhfesuperiori.eu</a>!</p>'
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
            subject: "eQSL",
            html:
                '<p>Ciao <span style="font-weight: 600">' +
                qso.callsign +
                '</span>, ecco la tua eQSL per il QSO con <span style="font-weight: 600">' +
                fromStation.callsign +
                "</span>!<br />" +
                'Puoi vedere il tuo QSO <a href="https://www.vhfesuperiori.eu/eqsl/' +
                qso._id +
                '">qui</a>.<br />' +
                'Buona giornata da <a href="https://www.vhfesuperiori.eu">www.vhfesuperiori.eu</a>!</p>',
            attachments: [
                {
                    filename: `eqsl_${callsignAlphanum}.png`,
                    path: filePath
                }
            ]
        };

        await EmailService.sendMail(message);
        logger.info("eQSL mail sent to user " + qso.callsign);
        await unlink(filePath);
    }
}

export default EmailService;
