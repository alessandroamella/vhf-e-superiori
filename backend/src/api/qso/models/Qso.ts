import { modelOptions, prop, Ref } from "@typegoose/typegoose";
import IsEmail from "isemail";
import { UserClass } from "../../auth/models";
import { EventClass } from "../../event/models";

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
 *          email:
 *            type: string
 *            description: The email of the station contacted
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
 *          emailSent:
 *            type: boolean
 *            description: Whether the email with the EQSL has been sent
 *          emailSentDate:
 *            type: string
 *            description: The date the email with the EQSL has been sent
 *          notes:
 *            type: string
 *            description: Notes about the QSO
 */

@modelOptions({
    schemaOptions: { timestamps: true },
    options: { customName: "Qso" }
})
export class QsoClass {
    // fromStation is User ref
    @prop({ required: true, ref: () => UserClass })
    public fromStation!: Ref<UserClass>;

    @prop({ required: true, minlength: 1, maxlength: 10, uppercase: true })
    public callsign!: string; // without prefix or suffix

    @prop({ required: false, validate: IsEmail.validate })
    public email?: string;

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
}
