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
import { mailjet } from "../mailjet";
import type { BasePostDoc } from "../post/models";
import { qrz } from "../qrz";
import type { QsoDoc } from "../qso/models";
import { removeTrailingSlash } from "../utils/removeTrailingSlash";

moment.locale("it");

export interface BatchQsoData {
  callsign: string;
  date: string;
  time: string;
  band: string;
  mode: string;
  eventName: string;
  imageHref: string;
}

// Mailjet API v3.1 types
interface MailjetEmailAddress {
  Email: string;
  Name?: string;
}

interface MailjetAttachment {
  Filename: string;
  ContentType: string;
  Base64Content: string;
}

interface MailjetInlineAttachment extends MailjetAttachment {
  ContentID: string;
}

interface MailjetMessage {
  From?: MailjetEmailAddress;
  Sender?: MailjetEmailAddress;
  To: MailjetEmailAddress[];
  Cc?: MailjetEmailAddress[];
  Bcc?: MailjetEmailAddress[];
  ReplyTo?: MailjetEmailAddress;
  Subject?: string;
  TextPart?: string;
  HTMLPart?: string;
  TemplateID?: number;
  TemplateLanguage?: boolean;
  TemplateErrorReporting?: {
    Email: string;
    Name?: string;
  };
  TemplateErrorDeliver?: boolean;
  Attachments?: MailjetAttachment[];
  InlineAttachments?: MailjetInlineAttachment[];
  Priority?: number;
  CustomCampaign?: string;
  DeduplicateCampaign?: boolean;
  TrackOpens?: "account_default" | "disabled" | "enabled";
  TrackClicks?: "account_default" | "disabled" | "enabled";
  CustomID?: string;
  EventPayload?: string;
  URLTags?: string;
  Headers?: Record<string, string>;
  Variables?: Record<string, string>;
}

interface MailjetSendRequest {
  SandboxMode?: boolean;
  AdvanceErrorHandling?: boolean;
  Globals?: Partial<MailjetMessage>;
  Messages: MailjetMessage[];
  // Index signature for Mailjet library compatibility
  [key: string]: unknown;
}

interface MailjetMessageResponse {
  Status: "success" | "error";
  Errors?: Array<{
    ErrorIdentifier: string;
    ErrorCode: string;
    StatusCode: number;
    ErrorMessage: string;
    ErrorRelatedTo?: string;
  }>;
  CustomID?: string;
  To?: Array<{
    Email: string;
    MessageUUID: string;
    MessageID: number;
    MessageHref: string;
  }>;
  Cc?: Array<{
    Email: string;
    MessageUUID: string;
    MessageID: number;
    MessageHref: string;
  }>;
  Bcc?: Array<{
    Email: string;
    MessageUUID: string;
    MessageID: number;
    MessageHref: string;
  }>;
}

interface MailjetSendResponse {
  Messages: MailjetMessageResponse[];
}

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

  /**
   * Parse email string in formats: "Name" email@example.com or "Name" <email@example.com> or email@example.com
   */
  private static parseEmailString(emailStr: string): {
    email: string;
    name?: string;
  } {
    // Try to match format with angle brackets: "Name" <email@example.com>
    let match = emailStr.match(/^"?([^"<]*?)"?\s*<(.+?)>/);
    if (match) {
      const name = match[1].trim();
      const email = match[2];
      return {
        email,
        ...(name && { name }),
      };
    }

    // Try to match format without brackets: "Name" email@example.com
    match = emailStr.match(/^"?([^"<]+?)"?\s+([^"<>\s]+@[^"<>\s]+)/);
    if (match) {
      const name = match[1].trim();
      const email = match[2];
      return {
        email,
        ...(name && { name }),
      };
    }

    // Fall back to plain email
    const plainEmail = emailStr.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+)/);
    if (plainEmail) {
      return { email: plainEmail[1] };
    }

    return { email: emailStr };
  }

  /**
   * Convert nodemailer Mail.Options to Mailjet API v3.1 format
   * Handles attachments by reading files and converting to base64
   */
  private static async convertToMailjetMessage(
    message: Mail.Options,
  ): Promise<MailjetMessage> {
    const mailjetMsg: MailjetMessage = {
      Subject: message.subject || "",
      TextPart: typeof message.text === "string" ? message.text : undefined,
      HTMLPart: typeof message.html === "string" ? message.html : undefined,
      To: [],
    };

    // Parse From field
    if (message.from) {
      const parsed = EmailService.parseEmailString(message.from.toString());
      mailjetMsg.From = {
        Email: parsed.email,
        ...(parsed.name && { Name: parsed.name }),
      };
    }

    // Parse To field
    if (message.to) {
      const toAddresses = Array.isArray(message.to) ? message.to : [message.to];
      for (const to of toAddresses) {
        const parsed = EmailService.parseEmailString(to.toString());
        mailjetMsg.To.push({
          Email: parsed.email,
          ...(parsed.name && { Name: parsed.name }),
        });
      }
    }

    // Parse Cc field
    if (message.cc) {
      const ccAddresses = Array.isArray(message.cc) ? message.cc : [message.cc];
      mailjetMsg.Cc = [];
      for (const cc of ccAddresses) {
        const parsed = EmailService.parseEmailString(cc.toString());
        mailjetMsg.Cc.push({
          Email: parsed.email,
          ...(parsed.name && { Name: parsed.name }),
        });
      }
    }

    // Parse Bcc field
    if (message.bcc) {
      const bccAddresses = Array.isArray(message.bcc)
        ? message.bcc
        : [message.bcc];
      mailjetMsg.Bcc = [];
      for (const bcc of bccAddresses) {
        const parsed = EmailService.parseEmailString(bcc.toString());
        mailjetMsg.Bcc.push({
          Email: parsed.email,
          ...(parsed.name && { Name: parsed.name }),
        });
      }
    }

    // Parse ReplyTo field
    if (message.replyTo) {
      const parsed = EmailService.parseEmailString(message.replyTo.toString());
      mailjetMsg.ReplyTo = {
        Email: parsed.email,
        ...(parsed.name && { Name: parsed.name }),
      };
    }

    // Handle attachments
    if (message.attachments && message.attachments.length > 0) {
      mailjetMsg.Attachments = [];

      for (const attachment of message.attachments) {
        let base64Content = "";

        if (typeof attachment.content === "string") {
          // If content is already a string, check if it's base64 or path
          if (attachment.encoding === "base64") {
            base64Content = attachment.content;
          } else {
            // Assume it's a file path
            const fileContent = await readFile(attachment.content);
            base64Content = fileContent.toString("base64");
          }
        } else if (Buffer.isBuffer(attachment.content)) {
          // If content is a Buffer
          base64Content = attachment.content.toString("base64");
        } else if (attachment.path) {
          // If path is provided
          const fileContent = await readFile(String(attachment.path));
          base64Content = fileContent.toString("base64");
        }

        mailjetMsg.Attachments.push({
          Filename: attachment.filename || "attachment",
          ContentType: attachment.contentType || "application/octet-stream",
          Base64Content: base64Content,
        });
      }
    }

    return mailjetMsg;
  }

  /**
   * Send email via Mailjet API v3.1
   * Provides better reliability and detailed error information
   */
  public static async sendMailViaMailjet(
    message: Mail.Options,
    sandboxMode: boolean = false,
  ): Promise<MailjetSendResponse> {
    try {
      const mailjetMessage =
        await EmailService.convertToMailjetMessage(message);

      const request: MailjetSendRequest = {
        SandboxMode: sandboxMode,
        Messages: [mailjetMessage],
      };

      const response = await (mailjet
        .post("send", { version: "v3.1" })
        .request(request) as unknown as Promise<{ body: MailjetSendResponse }>);

      console.log(
        "\n\n\nDEBUG Mailjet response body:",
        response.body,
        "TYPEEE",
        typeof response.body,
        "\n\n\n",
      );

      // Check for errors in the response
      if (
        response.body.Messages &&
        response.body.Messages.length > 0 &&
        response.body.Messages[0].Status === "error"
      ) {
        const errors = response.body.Messages[0].Errors;
        logger.error(`Mailjet API error: ${JSON.stringify(errors, null, 2)}`);
        throw new Error(
          `Mailjet error: ${errors?.[0]?.ErrorMessage || "Unknown error"}`,
        );
      }

      logger.debug(
        `Email sent successfully via Mailjet to ${message.to}, response: ${JSON.stringify(response.body)}`,
      );

      return response.body as MailjetSendResponse;
    } catch (error) {
      logger.error("Error while sending email via Mailjet");
      logger.error(error);
      throw error;
    }
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
      EmailService.transporter.sendMail(message, (err, info) => {
        if (err) {
          logger.error("Error while sending email");
          logger.error(err);
          return reject(err);
        }
        logger.debug(
          "Email sent successfully to " +
            message.to +
            ", info: " +
            (typeof info === "object" ? JSON.stringify(info) : info),
        );
        return resolve();
      });
    });
  }

  public static async sendResetPwMail(user: UserDoc, code: string) {
    const html = await EmailService.loadMailFromFile("changePw.ejs", {
      callsign: user.callsign,
      userId: user._id.toString(),
      resetPwdCode: code,
      baseUrl: removeTrailingSlash(envs.FRONTEND_URL),
    });

    const message: Mail.Options = {
      from: `"VHF e Superiori" ${process.env.SEND_EMAIL_FROM}`,
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
      from: `"VHF e Superiori" ${process.env.SEND_EMAIL_FROM}`,
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
      "{BASEURL}": removeTrailingSlash(envs.FRONTEND_URL),
      "{DESCRIZIONE}": isNewUser
        ? "grazie per esserti registrato su VHF e Superiori"
        : "abbiamo ricevuto la richiesta di cambio email",
    });

    const message: Mail.Options = {
      from: `"VHF e Superiori" ${process.env.SEND_EMAIL_FROM}`,
      to: user.email,
      subject: "Verifica email VHF e Superiori",
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
      from: `"VHF e Superiori" ${process.env.SEND_EMAIL_FROM}`,
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
      from: `"VHF e Superiori" ${process.env.SEND_EMAIL_FROM}`,
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
      from: `"VHF e Superiori" ${process.env.SEND_EMAIL_FROM}`,
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
      from: `"VHF e Superiori" ${process.env.SEND_EMAIL_FROM}`,
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
    const filePath = await eqslPic.saveImageToFile(
      path.join(
        envs.BASE_TEMP_DIR,
        envs.QSL_CARD_TMP_FOLDER,
        `eqsl-email-${qso._id}-${moment().unix()}.jpg`,
      ),
      "jpeg", // Force JPEG format for smaller file sizes
    );
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
      from: `"VHF e Superiori" ${process.env.SEND_EMAIL_FROM}`,
      to: toEmail,
      subject:
        "eQSL per il QSO con " +
        (qso.fromStationCallsignOverride || fromStation.callsign),
      html,
      attachments: [
        {
          filename: `eqsl_${callsignAlphanum}.jpg`,
          path: filePath,
        },
      ],
    };

    await EmailService.sendMail(message);
    logger.info(`eQSL mail sent to user ${qso.callsign} at email: ${toEmail}`);
    await unlink(filePath);
  }

  // allega immagine in qso.imageHref
  public static async sendEqslEmailViaMailjet(
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
      `Sending eQSL email via Mailjet to ${toEmail} with imageHref: ${qso.imageHref}`,
    );
    const eqslPic = new EqslPic(qso.imageHref);
    await eqslPic.fetchImage(eqslBuffer);
    const filePath = await eqslPic.saveImageToFile(
      path.join(
        envs.BASE_TEMP_DIR,
        envs.QSL_CARD_TMP_FOLDER,
        `eqsl-email-mailjet-${qso._id}-${moment().unix()}.jpg`,
      ),
      "jpeg", // Force JPEG format for smaller file sizes
    );
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
      from: `"VHF e Superiori" ${process.env.SEND_EMAIL_FROM}`,
      to: toEmail,
      subject:
        "eQSL per il QSO con " +
        (qso.fromStationCallsignOverride || fromStation.callsign),
      html,
      attachments: [
        {
          filename: `eqsl_${callsignAlphanum}.jpg`,
          path: filePath,
        },
      ],
    };

    await EmailService.sendMailViaMailjet(message);
    logger.info(
      `eQSL mail sent via Mailjet to user ${qso.callsign} at email: ${toEmail}`,
    );
    await unlink(filePath);
  }

  public static async sendEqslBatchEmail(
    toEmail: string,
    qsos: BatchQsoData[],
    attachments: { filename: string; path: string }[],
  ) {
    const html = await EmailService.loadMailFromFile("eqslBatch.ejs", {
      // biome-ignore lint/suspicious/noExplicitAny: casting to any to pass array to ejs
      qsos: qsos as any,
      count: qsos.length.toString(),
      baseUrl: removeTrailingSlash(envs.FRONTEND_URL),
    });

    const message: Mail.Options = {
      from: `"VHF e Superiori" ${process.env.SEND_EMAIL_FROM}`,
      to: toEmail,
      subject: `Hai ricevuto ${qsos.length} nuove eQSL!`,
      html,
      attachments, // Attachments passed from the job
    };

    await EmailService.sendMail(message);
    logger.info(
      `Batch eQSL mail sent to ${toEmail} containing ${qsos.length} QSOs`,
    );
  }

  // biome-ignore lint/suspicious/noExplicitAny: using any to check error properties
  public static isQuotaError(err: any): boolean {
    const response = (err?.response || "").toLowerCase();
    const message = (err?.message || "").toLowerCase();
    const code = err?.responseCode;

    return (
      code === 454 ||
      code === 554 ||
      ["limit exceeded", "quota exceeded", "limit reached"].some(
        (str) => message.includes(str) || response.includes(str),
      ) ||
      err?.code === "EM_QUOTA_EXCEEDED" // some providers use this code
    );
  }
}

export default EmailService;
