import { modelOptions, prop, Ref, Severity } from "@typegoose/typegoose";

/**
 * @swagger
 *  components:
 *    schemas:
 *      Beacon:
 *        type: object
 *        required:
 *          - callsign
 *          - owner
 *        properties:
 *          callsign:
 *            type: string
 *            minLength: 1
 *            maxLength: 10
 *            description: Callsign without prefixes / suffixes
 *            example: IU4QSG
 *          owner:
 *            type: string
 *            format: ObjectId
 *            description: User who maintains this beacon and can freely edit it
 */

@modelOptions({
  schemaOptions: { timestamps: true },
  options: { allowMixed: Severity.ERROR, customName: "Beacon" },
})
export class BeaconClass {
  @prop({ required: true, minlength: 1, maxlength: 10, uppercase: true })
  public callsign!: string;

  @prop({ required: true, ref: "User" })
  public owner!: Ref<"User">;
}
