import { modelOptions, prop, Ref, Severity } from "@typegoose/typegoose";
/**
 * @swagger
 *  components:
 *    schemas:
 *      Event:
 *        type: object
 *        required:
 *          - name
 *          - date
 *          - joinDeadline
 *          - joinRequests
 *        properties:
 *          name:
 *            type: string
 *            minLength: 1
 *            description: Name of the event
 *          description:
 *            type: string
 *            minLength: 1
 *            description: Description of the event
 *          band:
 *            type: string
 *            minLength: 1
 *            description: Radio band of the event
 *          date:
 *            type: string
 *            format: date-time
 *            description: Date of the event
 *          joinStart:
 *            type: string
 *            format: date-time
 *            description: Start date to join the event
 *          joinDeadline:
 *            type: string
 *            format: date-time
 *            description: Deadline to join the event
 *          logoUrl:
 *            type: string
 *            format: uri
 *            description: URL of the logo of this event
 *          eqslUrl:
 *            type: string
 *            format: uri
 *            description: URL of the eQSL image of this event (base image without callsign nor QSO data)
 *          joinRequests:
 *            type: array
 *            items:
 *              type: string
 *            description: ObjectIds of the join requests
 */

@modelOptions({
    schemaOptions: { timestamps: true },
    options: { allowMixed: Severity.ERROR, customName: "Event" }
})
export class EventClass {
    @prop({ required: true, minlength: 1 })
    public name!: string;

    @prop({ required: false })
    public description?: string;

    @prop({ required: true, minlength: 1 })
    public band!: string;

    @prop({ required: true })
    public date!: Date;

    @prop({ required: true })
    public joinStart!: Date;

    @prop({ required: true })
    public joinDeadline!: Date;

    @prop({ required: false })
    public logoUrl?: string;

    @prop({ required: false })
    public eqslUrl?: string;

    @prop({ required: true, default: [], ref: "JoinRequest" })
    public joinRequests!: Ref<"JoinRequest">[];
}
