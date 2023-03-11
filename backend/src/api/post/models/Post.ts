import { modelOptions, prop, Ref } from "@typegoose/typegoose";
import { Errors } from "../../errors";

/**
 * @swagger
 *  components:
 *    schemas:
 *      Post:
 *        type: object
 *        required:
 *          - fromUser
 *          - description
 *          - forEvent
 *          - isApproved
 *        properties:
 *          fromUser:
 *            type: string
 *            format: objectid
 *            description: ObjectId of the user who made this post
 *          description:
 *            type: string
 *            minLength: 1
 *            description: Description of the event
 *          pictures:
 *            type: array
 *            items:
 *              type: string
 *            description: Path of the pictures uploaded by the user (will be compressed)
 *            minItems: 1
 *            maxItems: 5
 *          videos:
 *            type: array
 *            items:
 *              type: string
 *            description: Path of the videos uploaded by the user (will be compressed)
 *            minItems: 0
 *            maxItems: 2
 *          isApproved:
 *            type: boolean
 *            description: Whether this post was approved (send email)
 */
@modelOptions({
    schemaOptions: { timestamps: true },
    options: { customName: "Post" }
})
// DEBUG ADD ALL OTHER FIELDS, ADD CATEGORY
export class PostClass {
    @prop({ required: true, ref: "User" })
    public fromUser!: Ref<"User">;

    @prop({ required: true, maxlength: 30 })
    public description!: string;

    @prop({
        required: true,
        minlength: 10,
        maxlength: 1000,
        validate: [
            (v: unknown[]) => v.length > 0 && v.length <= 5,
            Errors.INVALID_PICS_NUM
        ]
    })
    public pictures!: string[];

    @prop({
        required: true,
        minlength: 10,
        maxlength: 1000,
        validate: [
            (v: unknown[]) => v.length >= 0 && v.length <= 2,
            Errors.INVALID_VIDS_NUM
        ]
    })
    public videos!: string[];

    // DEBUG send email
    @prop({ required: true, default: false })
    public isApproved!: boolean;
}
