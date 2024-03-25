import {
    DocumentType,
    modelOptions,
    pre,
    prop,
    Ref
} from "@typegoose/typegoose";
import { User, UserClass } from "../../auth/models";
import { EventClass } from "../../event/models";
import sharp from "sharp";
import EqslPic from "../../eqsl/eqsl";
import { logger } from "../../../shared";
import EmailService from "../../../email";
import { qrz } from "../../qrz";
import { Qso } from ".";

/**
 * @swagger
 *  components:
 *    schemas:
 *      Qso:
 *        type: object
 *        required:
 *          - fromStation
 *          - callsign
 *          - event
 *          - frequency
 *          - mode
 *          - qsoDate
 *          - emailSent
 *        properties:
 *          fromStation:
 *            type: string
 *            description: The user who sent the QSO
 *          callsign:
 *            type: string
 *            description: The callsign of the station contacted
 *            minLength: 1
 *            maxLength: 10
 *            example: IU4QSG
 *          fromStationLat:
 *            type: number
 *            description: Latitude of the station that sent the QSO
 *          fromStationLon:
 *            type: number
 *            description: Longitude of the station that sent the QSO
 *          fromStationCity:
 *            type: string
 *            description: City of the station that sent the QSO
 *          fromStationProvince:
 *            type: string
 *            description: Province of the station that sent the QSO
 *          locator:
 *            type: string
 *            description: Locator of the station contacted
 *          toStationLat:
 *            type: number
 *            description: Latitude of the station contacted
 *          toStationLon:
 *            type: number
 *            description: Longitude of the station contacted
 *          rst:
 *            type: number
 *            description: RST code of the QSO
 *          event:
 *            type: string
 *            description: The event the QSO is related to
 *          frequency:
 *            type: number
 *            description: The frequency of the QSO in MHz
 *            example: 14.074
 *          mode:
 *            type: string
 *            description: The mode of the QSO
 *            example: FT8
 *          imageHref:
 *            type: string
 *            description: The URL of the EQSL image
 *          qsoDate:
 *            type: string
 *            format: date-time
 *            description: The date of the QSO
 *          email:
 *            type: string
 *            description: The email of the station contacted
 *          toStation:
 *            type: string
 *            format: ObjectId
 *            description: The user who received the QSO
 *          emailSent:
 *            type: boolean
 *            description: Whether the email with the EQSL has been sent
 *          emailSentDate:
 *            type: string
 *            format: date-time
 *            description: The date the email with the EQSL has been sent
 *          notes:
 *            type: string
 *            description: Notes about the QSO
 */

@modelOptions({
    schemaOptions: { timestamps: true },
    options: { customName: "Qso" }
})
@pre<QsoClass>("save", async function () {
    if (!this.email) {
        // find if already in db
        const user = await User.findOne({
            callsign: this.callsign
        });
        if (user) {
            this.toStation = user._id;
            this.email = user.email;
            return;
        }

        // find qso with same callsign and event to copy email
        const qso = await Qso.findOne({
            callsign: this.callsign,
            event: this.event,
            email: { $exists: true }
        });
        if (qso) {
            this.toStation = qso.toStation;
            this.email = qso.email;
            return;
        }

        // last resort: try to scrape email from QRZ
        const scraped = await qrz.scrapeEmail(this.callsign);
        if (scraped) {
            this.email = scraped;
            return;
        }
    }
    logger.warn(
        `No email found for QSO ${this._id} with callsign ${this.callsign}`
    );
})
export class QsoClass {
    // fromStation is User ref
    @prop({ required: true, ref: () => UserClass })
    public fromStation!: Ref<UserClass>;

    @prop({ required: false })
    public fromStationLat?: number;

    @prop({ required: false })
    public fromStationLon?: number;

    @prop({ required: true })
    public fromStationCity!: string;

    @prop({ required: true })
    public fromStationProvince!: string;

    @prop({ required: true, minlength: 1, maxlength: 10, uppercase: true })
    public callsign!: string; // without prefix or suffix

    @prop({ required: false })
    public locator?: string;

    @prop({ required: false, ref: () => UserClass })
    public toStation?: Ref<UserClass>;

    @prop({ required: false })
    public email?: string;

    @prop({ required: false })
    public toStationLat?: number;

    @prop({ required: false })
    public toStationLon?: number;

    @prop({ required: true, default: 59 })
    public rst!: number;

    @prop({ required: true, ref: () => EventClass })
    public event!: Ref<EventClass>;

    @prop({ required: true })
    public frequency!: number; // in MHz

    @prop({ required: true })
    public mode!: string; // SSB, CW, FT8, etc

    @prop({ required: false })
    public imageHref?: string; // URL of the EQSL image

    @prop({ required: true })
    public qsoDate!: Date;

    @prop({ required: true, default: false })
    public emailSent!: boolean;

    @prop({ required: false })
    public emailSentDate?: Date;

    @prop({ required: false })
    public notes?: string;

    public async sendEqsl(
        this: DocumentType<QsoClass>,
        eventId: string,
        eqslTemplateImgUrl: string,
        eqslTemplateImgPath?: string
    ): Promise<string> {
        if (!this.email) {
            throw new Error("No email found in sendEqsl for QSO " + this._id);
        }

        let eqslBuff: Buffer | null = null;

        const fromStation = await User.findOne({
            _id: this.fromStation
        });
        if (!fromStation) {
            throw new Error(
                "No fromStation found in sendEqsl for QSO " + this._id
            );
        }

        if (!this.imageHref) {
            if (!eqslTemplateImgPath) {
                const eqslPic = new EqslPic(eqslTemplateImgUrl);
                logger.debug(
                    "Fetching eQSL template image for event " + eventId
                );
                await eqslPic.fetchImage();
                const tempPath = await eqslPic.saveImageToFile();
                eqslTemplateImgPath = tempPath;
            }
            if (!eqslTemplateImgPath) {
                throw new Error(
                    "No image file path found in sendEqsl for event " + eventId
                );
            }

            const imgBuf = await sharp(eqslTemplateImgPath).toBuffer();
            const eqslPic = new EqslPic(imgBuf);
            logger.debug("Adding QSO info to image buffer for QSO " + this._id);
            await eqslPic.addQsoInfo(this, fromStation, eqslTemplateImgPath);
            const href = await eqslPic.uploadImage(fromStation._id.toString());
            this.imageHref = href;
            logger.info(`Uploaded eQSL image to ${href} for QSO ${this._id}`);
            await this.save();
            eqslBuff = eqslPic.getImage();
        }

        await EmailService.sendEqslEmail(
            this,
            fromStation,
            this.email,
            eqslBuff ?? undefined
        );
        this.emailSent = true;
        this.emailSentDate = new Date();
        await this.save();

        return this.imageHref;
    }
}
