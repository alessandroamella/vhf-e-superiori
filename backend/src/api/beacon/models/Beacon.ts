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
 *          owner:
 *            type: string
 *            maxLength: 10
 *            description: >-
 *              Callsign of the maintainer of this beacon. May be any callsign
 *              (even one not registered on the site) and may be absent, in which
 *              case the beacon is considered "pending verification".
 *            example: IU4QSG
 */

@modelOptions({
  schemaOptions: { timestamps: true },
  options: { allowMixed: Severity.ERROR, customName: "Beacon" },
})
export class BeaconClass {
  @prop({ required: true, minlength: 1, maxlength: 10, uppercase: true })
  public callsign!: string;

  // Maintainer callsign. Free-form (not necessarily a registered user) and
  // optional — when absent the beacon shows as "in verifica" on the frontend.
  @prop({ required: false, maxlength: 10, uppercase: true, trim: true })
  public owner?: string;
}
