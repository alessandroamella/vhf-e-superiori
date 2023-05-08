import { modelOptions, prop, Ref, Severity } from "@typegoose/typegoose";
import { EventClass } from "../../event/models";

/**
 * @swagger
 *  components:
 *    schemas:
 *      JoinRequest:
 *        type: object
 *        required:
 *          - fromUser
 *          - postType
 *          - antenna
 *          - forEvent
 *          - isApproved
 *        properties:
 *          fromUser:
 *            type: string
 *            format: objectid
 *            description: ObjectId of the user who made this join request
 *          antenna:
 *            type: string
 *            minLength: 1
 *            maxLength: 300
 *            description: Description of the antenna used for this event
 *          forEvent:
 *            type: string
 *            format: objectid
 *            description: ObjectId of the event this join request is for
 *          isApproved:
 *            type: boolean
 *            description: Whether this join request was approved (send email)
 */
@modelOptions({
    schemaOptions: { timestamps: true },
    options: { allowMixed: Severity.ERROR, customName: "JoinRequest" }
})
export class JoinRequestClass {
    @prop({ required: true, ref: "User" })
    public fromUser!: Ref<"User">;

    @prop({ required: true, minlength: 1, maxlength: 300 })
    public antenna!: string; // info about the antenna

    @prop({ required: true, ref: () => EventClass })
    public forEvent!: Ref<EventClass>;

    // DEBUG send email
    @prop({ required: true, default: false })
    public isApproved!: boolean;
}
