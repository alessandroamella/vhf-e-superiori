import {
    DocumentType,
    modelOptions,
    pre,
    prop,
    Ref
} from "@typegoose/typegoose";
import { User, UserClass } from "../../auth/models";
import { EventClass, EventDoc } from "../../event/models";
import sharp from "sharp";
import EqslPic from "../../eqsl/eqsl";
import { logger } from "../../../shared";
import EmailService from "../../../email";
import { qrz } from "../../qrz";
import { Qso } from ".";
import { location } from "../../location";

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
 *            description: Locator of the station that sent the QSO
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
 *            type: string
 *            description: The frequency of the QSO in MHz
 *            example: 14.074
 *          band:
 *            type: string
 *            description: The band of the QSO
 *            example: 23cm
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
    if ((!this.fromStationLat || !this.fromStationLon) && this.locator) {
        const latLon = location.calculateLatLon(this.locator);
        if (latLon) {
            this.fromStationLat = latLon[0];
            this.fromStationLon = latLon[1];
        } else {
            logger.warn(
                `No lat/lon found for QSO ${this._id} with locator ${this.locator}`
            );
        }
    } else if (!this.locator && this.fromStationLat && this.fromStationLon) {
        this.locator =
            location.calculateQth(this.fromStationLat, this.fromStationLon) ||
            undefined;
    }
    if (!this.fromStationCity || !this.fromStationProvince) {
        if (!this.fromStationLat || !this.fromStationLon) {
            logger.error("Can't reverse geocode QSO in pre hook for QSO:");
            logger.error(this);
            return;
        }
        const geocoded = await location.reverseGeocode(
            this.fromStationLat,
            this.fromStationLon
        );
        if (!geocoded) {
            logger.error(
                `No reverse geocoding found for QSO ${this._id} with lat ${this.fromStationLat} and lon ${this.fromStationLon}`
            );
            return;
        }
        const city =
            geocoded.address_components.find(
                e =>
                    e.types.includes("administrative_area_level_3") ||
                    e.types.includes("locality")
            )?.long_name || geocoded.address_components[0]?.long_name;
        const province =
            geocoded.address_components.find(
                e =>
                    e.types.includes("administrative_area_level_2") ||
                    e.types.includes("administrative_area_level_1")
            )?.short_name ||
            geocoded.address_components[1]?.short_name ||
            geocoded.address_components[0]?.short_name;
        this.fromStationCity = city;
        this.fromStationProvince = province;

        logger.info(
            `Reverse geocoded QSO ${this._id} with lat ${this.fromStationLat} and lon ${this.fromStationLon} to city ${city} and province ${province}`
        );
    }
    if (!this.email || !this.toStationLat || !this.toStationLon) {
        // find if already in db

        const _callsigns = this.callsign.split("/");
        _callsigns.sort((a, b) => b.length - a.length);
        const callsignClean = _callsigns[0];

        logger.debug(`Callsign ${this.callsign} cleaned ${callsignClean}`);

        const user = await User.findOne({
            callsign: callsignClean
        });
        if (user) {
            this.toStation = user._id;
            this.email = user.email;
            this.toStationLat = user.lat;
            this.toStationLon = user.lon;
            if (!this.toStationLat ? user.lat : true) {
                return;
            }
        }

        // find qso with same callsign and event to copy email
        const qso = await Qso.findOne({
            callsign: callsignClean,
            event: this.event,
            email: { $exists: true }
        });
        if (qso) {
            this.toStation = qso.toStation;
            this.email = qso.email;
            this.toStationLat = qso.toStationLat;
            this.toStationLon = qso.toStationLon;
            if (!this.toStationLat ? qso.toStationLat : true) {
                return;
            }
        }

        // last resort: try to scrape email from QRZ
        const scraped = await qrz.getInfo(callsignClean);
        if (scraped) {
            this.email = scraped.email;
            this.toStationLat = scraped.lat;
            this.toStationLon = scraped.lon;
            return;
        }
        logger.warn(
            `No email or coordinates found for QSO ${this._id} with callsign ${this.callsign} cleaned ${callsignClean}`
        );
    }
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

    @prop({ required: false })
    public frequency?: number; // in MHz

    @prop({ required: true })
    public band!: string;

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
        event: EventDoc,
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
                    "Fetching eQSL template image for event " + event._id
                );
                await eqslPic.fetchImage();
                const tempPath = await eqslPic.saveImageToFile();
                eqslTemplateImgPath = tempPath;
            }
            if (!eqslTemplateImgPath) {
                throw new Error(
                    "No image file path found in sendEqsl for event " +
                        event._id
                );
            }

            const imgBuf = await sharp(eqslTemplateImgPath).toBuffer();
            const eqslPic = new EqslPic(imgBuf);
            logger.debug("Adding QSO info to image buffer for QSO " + this._id);
            await eqslPic.addQsoInfo(
                this,
                fromStation,
                eqslTemplateImgPath,
                event
            );
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
            event,
            eqslBuff ?? undefined
        );
        this.emailSent = true;
        this.emailSentDate = new Date();
        await this.save();

        return this.imageHref;
    }
}
