import {
    modelOptions,
    mongoose,
    pre,
    prop,
    Ref,
    Severity
} from "@typegoose/typegoose";
import { Errors } from "../../errors";
import { CommentClass } from "../../comment/models/Comment";

/**
 * @swagger
 *  components:
 *    schemas:
 *      BasePost:
 *        type: object
 *        required:
 *          - fromUser
 *          - description
 *          - pictures
 *          - videos
 *          - isApproved
 *          - isProcessing
 *          - comments
 *          - createdAt
 *          - updatedAt
 *        properties:
 *          fromUser:
 *            type: string
 *            format: objectid
 *            description: ObjectId of the user who made this post
 *          description:
 *            type: string
 *            minLength: 1
 *            maxLength: 300
 *            description: Description of the post
 *          pictures:
 *            type: array
 *            items:
 *              type: string
 *            description: Path of the pictures uploaded by the user (will be compressed)
 *            minItems: 0
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
 *          isProcessing:
 *            type: boolean
 *            description: Whether this post is currently being processed (video compression)
 *          createdAt:
 *            type: string
 *            format: date-time
 *            description: Document creation date (handled by MongoDB)
 *          updatedAt:
 *            type: string
 *            format: date-time
 *            description: Document update date (handled by MongoDB)
 */
@pre<BasePostClass>("save", function (next) {
    // Controlla che ci sia almeno una foto o un video
    if (this.pictures.length === 0 && this.videos.length === 0) {
        next(new Error(Errors.NO_CONTENT));
    } else {
        next();
    }
})
@modelOptions({
    schemaOptions: { timestamps: true },
    options: { allowMixed: Severity.ERROR, customName: "BasePost" }
})
export class BasePostClass {
    @prop({ required: true, ref: "User" })
    public fromUser!: Ref<"User">;

    @prop({ required: true, minlength: 1, maxlength: 300 })
    public description!: string;

    @prop({
        type: () => [String],
        required: true,
        validate: [
            (v: unknown[]) => v.length >= 0 && v.length <= 5,
            Errors.INVALID_PICS_NUM
        ]
    })
    public pictures!: mongoose.Types.Array<string>;

    @prop({
        type: () => [String],
        required: true,
        validate: [
            (v: unknown[]) => v.length >= 0 && v.length <= 2,
            Errors.INVALID_VIDS_NUM
        ]
    })
    public videos!: mongoose.Types.Array<string>;

    @prop({ required: true, default: false })
    public isApproved!: boolean;

    @prop({ required: true, default: false })
    public isProcessing!: boolean;

    @prop({ ref: () => CommentClass, required: true, default: [] })
    public comments?: Ref<CommentClass>[];

    // @prop({ ref: "Comment", default: [] })
    // public comments?: Ref<"Comment">[];
}
