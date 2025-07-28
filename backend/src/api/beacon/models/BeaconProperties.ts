import {
  getModelForClass,
  modelOptions,
  prop,
  Ref,
  Severity,
} from "@typegoose/typegoose";

/**
 * @swagger
 *  components:
 *    schemas:
 *      BeaconProperties:
 *        type: object
 *        required:
 *          - frequency
 *          - qthStr
 *          - locator
 *          - hamsl
 *          - antenna
 *          - mode
 *          - qtf
 *          - power
 *          - editAuthor
 *          - editDate
 *        properties:
 *          frequency:
 *            type: number
 *            description: Frequency in MHz
 *          qthStr:
 *            type: string
 *            description: QTH (location) string
 *          locator:
 *            type: string
 *            description: Locator
 *          hamsl:
 *            type: number
 *            description: Height above mean sea level in meters
 *          antenna:
 *            type: string
 *            description: Antenna type
 *          mode:
 *            type: string
 *            description: Transmission mode
 *          qtf:
 *            type: string
 *            description: Direction of the antenna
 *          power:
 *            type: number
 *            description: Power in watts
 *          name:
 *            type: string
 *            description: Name of the beacon (optional)
 *          lat:
 *            type: number
 *            description: Latitude (optional)
 *          lon:
 *            type: number
 *            description: Longitude (optional)
 *          verifiedBy:
 *            type: string
 *            format: ObjectId
 *            description: Admin that verified the beacon (optional)
 *          verifyDate:
 *            type: string
 *            format: date-time
 *            description: Date when the beacon was verified (optional)
 *          editAuthor:
 *            type: string
 *            format: ObjectId
 *            description: User that made the edit
 *          editDate:
 *            type: string
 *            format: date-time
 *            description: Date when the edit was made
 */

@modelOptions({
  schemaOptions: { timestamps: true },
  options: { allowMixed: Severity.ERROR, customName: "BeaconProperties" },
})
export class BeaconPropertiesClass {
  @prop({ required: true, ref: "Beacon" })
  public forBeacon!: Ref<"Beacon">;

  @prop({ required: false })
  public name?: string;

  @prop({ required: true })
  public frequency!: number; // in MHz

  @prop({ required: true })
  public qthStr!: string;

  @prop({ required: true })
  public locator!: string;

  @prop({ required: true })
  public hamsl!: number; // height above mean sea level in meters

  @prop({ required: true })
  public antenna!: string;

  @prop({ required: true })
  public mode!: string;

  @prop({ required: true })
  public qtf!: string; // direction of the antenna

  @prop({ required: true })
  public power!: number; // in watts

  @prop({ required: false })
  public lat?: number;

  @prop({ required: false })
  public lon?: number;

  @prop({ required: false, ref: "User" })
  public verifiedBy?: Ref<"User">;

  @prop({ required: false })
  public verifyDate?: Date;

  @prop({ required: true, ref: "User" })
  public editAuthor!: Ref<"User">;

  @prop({ required: true, default: Date.now })
  public editDate!: Date;
}

const BeaconProperties = getModelForClass(BeaconPropertiesClass);
export default BeaconProperties;
