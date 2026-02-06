import { unlink } from "node:fs/promises";
import {
  DocumentType,
  modelOptions,
  pre,
  prop,
  Ref,
} from "@typegoose/typegoose";
import sharp from "sharp";
import { logger } from "../../../shared";
import { User, UserClass } from "../../auth/models";
import EmailService from "../../email";
import EqslPic from "../../eqsl/eqsl";
import { EventClass, EventDoc } from "../../event/models";
import { location } from "../../location";
import { qrz } from "../../qrz";

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
  options: { customName: "Qso" },
})
@pre<QsoClass>("save", async function () {
  if ((!this.fromStationLat || !this.fromStationLon) && this.locator) {
    const latLon = location.calculateLatLon(this.locator);
    if (latLon) {
      this.fromStationLat = latLon[0];
      this.fromStationLon = latLon[1];
    } else {
      logger.warn(
        `No lat/lon found for QSO ${this._id} with locator ${this.locator}`,
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
      this.fromStationLon,
    );
    if (!geocoded) {
      logger.error(
        `No reverse geocoding found for QSO ${this._id} with lat ${this.fromStationLat} and lon ${this.fromStationLon}`,
      );
      return;
    }

    const { city, province } = location.parseData(geocoded);

    this.fromStationCity = city;
    this.fromStationProvince = province;

    logger.info(
      `Reverse geocoded QSO ${this._id} with lat ${this.fromStationLat} and lon ${this.fromStationLon} to city ${city} and province ${province}`,
    );
  }
  if (!this.email || !this.toStationLat || !this.toStationLon) {
    // find if already in db

    const _callsigns = this.callsign.split("/");
    _callsigns.sort((a, b) => b.length - a.length);
    const callsignClean = _callsigns[0];

    logger.debug(`Callsign ${this.callsign} cleaned ${callsignClean}`);

    const user = await User.findOne({
      callsign: callsignClean,
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

    // last resort: try to scrape email from QRZ
    const scraped = await qrz.getInfo(callsignClean);
    if (scraped) {
      this.email = scraped.email;
      this.toStationLat = scraped.lat;
      this.toStationLon = scraped.lon;
      return;
    }
    logger.warn(
      `No email or coordinates found for QSO ${this._id} with callsign ${this.callsign} cleaned ${callsignClean}`,
    );
  }
})
export class QsoClass {
  // fromStation is User ref
  @prop({ required: true, ref: () => UserClass })
  public fromStation!: Ref<UserClass>;

  @prop({ required: false })
  public fromStationCallsignOverride?: string;

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

  public async generateEqsl(
    this: DocumentType<QsoClass>,
    event: EventDoc,
    eqslTemplateImgUrl: string,
    eqslTemplateImgPath?: string,
  ): Promise<string> {
    if (this.imageHref) {
      return this.imageHref;
    }

    const fromStation = await User.findOne({ _id: this.fromStation });
    if (!fromStation) {
      throw new Error(`No fromStation found for QSO ${this._id}`);
    }

    if (!eqslTemplateImgPath) {
      const eqslPic = new EqslPic(eqslTemplateImgUrl);
      await eqslPic.fetchImage();
      const tempPath = await eqslPic.saveImageToFile(undefined, "png");
      eqslTemplateImgPath = tempPath;
    }

    const imgBuf = await sharp(eqslTemplateImgPath).toBuffer();
    const eqslPic = new EqslPic(imgBuf);

    // Pass the actual event object, not just ID
    await eqslPic.addQsoInfo(this, fromStation, eqslTemplateImgPath, event);

    const href = await eqslPic.uploadImage(fromStation._id.toString());
    this.imageHref = href;
    await this.save();

    // Clean up temp file if we created it locally in this function
    if (!eqslTemplateImgPath && eqslTemplateImgPath) {
      try {
        await unlink(eqslTemplateImgPath);
      } catch (e) {
        logger.debug(
          `No temp file to clean up for QSO ${this._id}: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }

    return href;
  }

  // UPDATED METHOD: Uses the method above, then sends single email (backward compat / force send)
  public async sendEqsl(
    this: DocumentType<QsoClass>,
    event: EventDoc,
    eqslTemplateImgUrl: string,
    eqslTemplateImgPath?: string,
    useMailjet = false,
  ): Promise<string> {
    if (!this.email) {
      throw new Error(`No email found in sendEqsl for QSO ${this._id}`);
    }

    // 1. Ensure Image Exists
    await this.generateEqsl(event, eqslTemplateImgUrl, eqslTemplateImgPath);

    const fromStation = await User.findOne({ _id: this.fromStation });
    if (!fromStation) throw new Error("FromStation not found");

    // 2. Fetch buffer for attachment
    const eqslPic = new EqslPic(this.imageHref!);
    await eqslPic.fetchImage();

    // 3. Send Email
    if (useMailjet) {
      await EmailService.sendEqslEmailViaMailjet(
        this,
        fromStation,
        this.email,
        event,
        eqslPic.getImage() ?? undefined,
      );
    } else {
      await EmailService.sendEqslEmail(
        this,
        fromStation,
        this.email,
        event,
        eqslPic.getImage() ?? undefined,
      );
    }

    this.emailSent = true;
    this.emailSentDate = new Date();
    await this.save();

    return this.imageHref!;
  }
}
