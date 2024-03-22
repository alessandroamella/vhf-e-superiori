import { modelOptions, prop, Severity } from "@typegoose/typegoose";

/**
 * @swagger
 *  components:
 *    schemas:
 *      Beacon:
 *        type: object
 *        required:
 *          - callsign
 *        properties:
 *          callsign:
 *            type: string
 *            minLength: 1
 *            maxLength: 10
 *            description: Callsign without prefixes / suffixes
 *            example: IU4QSG
 */

@modelOptions({
    schemaOptions: { timestamps: true },
    options: { allowMixed: Severity.ERROR, customName: "Beacon" }
})
export class BeaconClass {
    @prop({ required: true, minlength: 1, maxlength: 10, uppercase: true })
    public callsign!: string;
}
