import { readFile, unlink } from "node:fs/promises";
import path from "node:path";
import ejs from "ejs";
import { getDistance } from "geolib";
import moment from "moment-timezone";
import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import { envs, logger } from "../../shared";
import type { UserDoc } from "../auth/models";
import type { CommentDoc } from "../comment/models";
import EqslPic from "../eqsl/eqsl";
import type { EventDoc } from "../event/models";
import type { JoinRequestDoc } from "../joinRequest/models";
import type { BasePostDoc } from "../post/models";
import { qrz } from "../qrz";
import type { QsoDoc } from "../qso/models";

moment.locale("it");

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  private static adminEmails = Array.from(
    Array(parseInt(envs.TOT_ADMIN_EMAILS, 10)).keys(),
  ).map((i) => process.env[`ADMIN_EMAIL_${i}`] as string);

  private static async loadMailFromFile(
    name: string,
    params: { [name: string]: string },
  ) {
    const text = await readFile(path.join(process.cwd(), "emails", name), {
      encoding: "utf-8",
    });
    // replace params with their values
    if (name.endsWith(".html")) {
      return Object.entries(params).reduce(
        (acc, [key, value]) => acc.replace(new RegExp(key, "g"), value),
        text,
      );
    } else if (name.endsWith(".ejs")) {
      return ejs.render(text, params);
    } else {
      logger.error(`Invalid email file extension: ${name}`);
      return text;
    }
  }

  private static _initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      EmailService.transporter = nodemailer.createTransport({
        host: envs.MAIL_SERVER,
        auth: {
          user: envs.MAIL_USERNAME,
          pass: envs.MAIL_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      EmailService.transporter.verify((err, success): void => {
        if (err) {
          logger.error(err);
          reject(err);
        } else {
          logger.info(`Email ready: ${success}`);
          resolve();
        }
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
      EmailService.transporter.sendMail(message, (err) => {
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
    const html = await EmailService.loadMailFromFile("changePw.html", {
      "{NOMINATIVO}": user.callsign,
      "{USERID}": user._id.toString(),
      "{CODE}": code,
    });

    const message: Mail.Options = {
      from: `"VHF e superiori" ${process.env.SEND_EMAIL_FROM}`,
      to: user.email,
      subject: "Reset password",
      html,
    };

    await EmailService.sendMail(message);
    logger.info(
      "Verify user mail sent to user " +
        user.callsign +
        " at email: " +
        user.email,
    );
  }

  public static async sendNewAdminMail(newAdmin: UserDoc) {
    const html = await EmailService.loadMailFromFile("admin.html", {
      "{NOMINATIVO}": newAdmin.callsign,
    });
    const message: Mail.Options = {
      from: `"VHF e superiori" ${process.env.SEND_EMAIL_FROM}`,
      to: newAdmin.email,
      subject: "Nuovo amministratore",
      html,
    };

    await EmailService.sendMail(message);
    logger.info(`New admin mail sent to user ${newAdmin.callsign}`);
  }

  public static async sendVerifyMail(
    user: UserDoc,
    code: string,
    isNewUser: boolean,
  ) {
    const html = await EmailService.loadMailFromFile("signup.html", {
      "{NOMINATIVO}": user.callsign,
      "{USERID}": user._id.toString(),
      "{CODE}": code,
      "{AZIONE}": isNewUser ? "Benvenuto!" : "Cambio email",
      "{DESCRIZIONE}": isNewUser
        ? "grazie per esserti registrato su VHF e superiori"
        : "abbiamo ricevuto la richiesta di cambio email",
    });

    const message: Mail.Options = {
      from: `"VHF e superiori" ${process.env.SEND_EMAIL_FROM}`,
      to: user.email,
      subject: "Verifica email VHF e superiori",
      html,
    };

    await EmailService.sendMail(message);
    logger.info(
      "Verify user mail sent to user " +
        user.callsign +
        " at email: " +
        user.email,
    );
  }

  public static async sendJoinRequestMail(
    joinRequest: JoinRequestDoc,
    event: EventDoc,
    user: UserDoc,
  ) {
    const html = await EmailService.loadMailFromFile("requestStation.html", {
      "{NOMINATIVO}": user.callsign,
      "{EVENTO}": event.name,
      "{ANTENNA}": joinRequest.antenna,
    });

    const message: Mail.Options = {
      from: `"VHF e superiori" ${process.env.SEND_EMAIL_FROM}`,
      to: user.email,
      subject: "Richiesta per stazione attivatrice",
      html,
    };

    await EmailService.sendMail(message);
    logger.info(
      "Join request mail sent to user " +
        user.callsign +
        " at email: " +
        user.email,
    );
  }

  public static async sendAcceptJoinRequestMail(
    event: EventDoc,
    user: UserDoc,
  ) {
    const html = await EmailService.loadMailFromFile("acceptedStation.html", {
      "{NOMINATIVO}": user.callsign,
      "{EVENTO}": event.name,
      "{DATA}": moment(event.date).tz("Europe/Rome").format("dddd D MMMM YYYY"),
      "{ORA}": moment(event.date).tz("Europe/Rome").format("HH:mm"),
      "{PATHIMMAGINE}":
        event.logoUrl ||
        "https://vhfesuperiori.s3.eu-central-1.amazonaws.com/logo/logo192.png",
      "{BANDA}": event.band,
      "{EVENTID}": event._id.toString(),
    });
    const message: Mail.Options = {
      from: `"VHF e superiori" ${process.env.SEND_EMAIL_FROM}`,
      to: user.email,
      subject: "Accettazione richiesta stazione attivatrice",
      html,
    };

    await EmailService.sendMail(message);
    logger.info(
      "Join request mail sent to user " +
        user.callsign +
        " at email: " +
        user.email,
    );
  }

  public static async sendAdminJoinRequestMail(
    joinRequest: JoinRequestDoc,
    event: EventDoc,
    user: UserDoc,
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
        '<a href="https://www.vhfesuperiori.eu/eventmanager">vhfesuperiori.eu/eventmanager</a>.</p>',
    };

    await EmailService.sendMail(message);
    logger.info(`Join request mail sent to admin for user ${user.callsign}`);
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
    comment: CommentDoc,
    parentComment?: CommentDoc,
  ) {
    const scraped = await qrz.getInfo(fromUser.callsign);

    const message: Mail.Options = {
      from: `"VHF e superiori" ${process.env.SEND_EMAIL_FROM}`,
      to: forUser.email,
      subject: parentComment
        ? `Nuova risposta da ${fromUser.callsign} al tuo commento`
        : `Nuovo commento da ${fromUser.callsign} al tuo post`,
      html: await EmailService.loadMailFromFile("comment.ejs", {
        NOMINATIVO: fromUser.callsign,
        POSTID: post._id.toString(),
        POST: post.description,
        NOMINATIVO_COMMENTO: fromUser.callsign,
        CONTENUTO_COMMENTO: comment.content,
        COMMENTID: comment._id.toString(),
        IS_REPLY: parentComment ? "true" : "false",
        PP_COMMENTO:
          scraped?.pictureUrl ||
          "https://vhfesuperiori.s3.eu-central-1.amazonaws.com/logo/logo192.png",
      }),
    };

    await EmailService.sendMail(message);
    logger.info(
      "Comment mail sent to user " +
        fromUser.callsign +
        " at email: " +
        forUser.email +
        (parentComment
          ? ` as reply of parent comment ${parentComment._id}`
          : ""),
    );
  }

  // allega immagine in qso.imageHref
  public static async sendEqslEmail(
    qso: QsoDoc,
    fromStation: UserDoc,
    toEmail: string,
    event: EventDoc,
    eqslBuffer?: Buffer,
  ) {
    if (!qso.imageHref) {
      throw new Error("Qso has no imageHref");
    }
    logger.debug(
      `Sending eQSL email to ${toEmail} with imageHref: ${qso.imageHref}`,
    );
    const eqslPic = new EqslPic(qso.imageHref);
    await eqslPic.fetchImage(eqslBuffer);
    const filePath = await eqslPic.saveImageToFile();
    const callsignAlphanum = qso.callsign
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();

    const distance =
      qso.fromStationLat &&
      qso.fromStationLon &&
      qso.toStationLat &&
      qso.toStationLon
        ? getDistance(
            {
              latitude: qso.fromStationLat,
              longitude: qso.fromStationLon,
            },
            {
              latitude: qso.toStationLat,
              longitude: qso.toStationLon,
            },
          )
        : null;

    logger.debug(
      `Distance between (${qso.fromStationLat}, ${qso.fromStationLon}) and (${qso.toStationLat}, ${qso.toStationLon}) is ${distance} meters`,
    );

    const html = await EmailService.loadMailFromFile("eqsl.html", {
      "{NOMINATIVO}": qso.callsign,
      "{STAZIONE}": qso.fromStationCallsignOverride || fromStation.callsign,
      "{QSOID}": qso._id.toString(),
      "{EVENTO}": event.name,
      "{EVENTID}": event._id.toString(),
      "{DATA}": moment(qso.qsoDate).tz("Europe/Rome").format("DD/MM/YYYY"),
      "{ORA}": moment(qso.qsoDate).format("HH:mm"), // in UTC, not timezone
      "{BANDA}": qso.band,
      "{LOCATORE}": qso.locator || "N/D",
      "{DISTANZA}": distance ? Math.round(distance / 1000).toString() : "N/D",
    });

    const message: Mail.Options = {
      from: `"VHF e superiori" ${process.env.SEND_EMAIL_FROM}`,
      to: toEmail,
      subject:
        "eQSL per il QSO con " +
        (qso.fromStationCallsignOverride || fromStation.callsign),
      html,
      attachments: [
        {
          filename: `eqsl_${callsignAlphanum}.png`,
          path: filePath,
        },
      ],
    };

    await EmailService.sendMail(message);
    logger.info(`eQSL mail sent to user ${qso.callsign} at email: ${toEmail}`);
    await unlink(filePath);
  }
}

export default EmailService;
