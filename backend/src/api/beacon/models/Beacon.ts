import { modelOptions, prop, Severity } from "@typegoose/typegoose";

/**
 * @swagger
 *  components:
 *    schemas:
 *      Beacon:
 *        type: object
 *        required:
 *          - callsign
 *          - properties
 *        properties:
 *          callsign:
 *            type: string
 *            minLength: 1
 *            maxLength: 10
 *            description: Callsign without prefixes / suffixes
 *            example: IU4QSG
 *          properties:
 *            type: object
 *            required:
 *              - name
 *              - frequency
 *              - qthStr
 *              - locator
 *              - hamsl
 *              - antenna
 *              - mode
 *              - qtf
 *              - power
 *              - editAuthor
 *              - editDate
 *            properties:
 *              name:
 *                type: string
 *                description: Name of the beacon
 *              frequency:
 *                type: number
 *                description: Frequency in MHz
 *              qthStr:
 *                type: string
 *                description: QTH (location) string
 *              locator:
 *                type: string
 *                description: Locator
 *              hamsl:
 *                type: number
 *                description: Height above mean sea level in meters
 *              antenna:
 *                type: string
 *                description: Antenna type
 *              mode:
 *                type: string
 *                description: Transmission mode
 *              qtf:
 *                type: string
 *                description: Direction of the antenna
 *              power:
 *                type: number
 *                description: Power in watts
 *              lat:
 *                type: number
 *                description: Latitude (optional)
 *              lon:
 *                type: number
 *                description: Longitude (optional)
 *              isVerified:
 *                type: string
 *                format: ObjectId
 *                description: Admin that verified the beacon (optional)
 *              editAuthor:
 *                type: string
 *                format: ObjectId
 *                description: User that made the edit
 *              editDate:
 *                type: string
 *                format: date-time
 *                description: Date when the edit was made
 */

@modelOptions({
    schemaOptions: { timestamps: true },
    options: { allowMixed: Severity.ERROR, customName: "Beacon" }
})
export class BeaconClass {
    @prop({ required: true, minlength: 1, maxlength: 10, uppercase: true })
    public callsign!: string;
}
