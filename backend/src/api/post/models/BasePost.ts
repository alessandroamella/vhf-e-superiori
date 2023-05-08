import {
    modelOptions,
    mongoose,
    prop,
    Ref,
    Severity
} from "@typegoose/typegoose";
import { Errors } from "../../errors";

/**
 * @swagger
 *  components:
 *    schemas:
 *      BasePost:
 *        type: object
 *        required:
 *          - fromUser
 *          - postType
 *          - pictures
 *          - videos
 *          - isApproved
 *          - createdAt
 *          - updatedAt
 *        properties:
 *          fromUser:
 *            type: string
 *            format: objectid
 *            description: ObjectId of the user who made this post
 *          postType:
 *            type: string
 *            enum: ["antennaPost", "myFlashMobPost", "radioStationPost"]
 *            description: The type of post
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
 *          createdAt:
 *            type: string
 *            format: date-time
 *            description: Document creation date (handled by MongoDB)
 *          updatedAt:
 *            type: string
 *            format: date-time
 *            description: Document update date (handled by MongoDB)
 */
@modelOptions({
    schemaOptions: { timestamps: true },
    options: { allowMixed: Severity.ERROR, customName: "BasePost" }
})
export class BasePostClass {
    @prop({ required: true, ref: "User" })
    public fromUser!: Ref<"User">;

    @prop({
        type: () => String,
        required: true,
        enum: ["antennaPost", "myFlashMobPost", "radioStationPost"]
    })
    public postType!: string;

    @prop({
        type: () => [String],
        required: true,
        validate: [
            (v: unknown[]) => v.length > 0 && v.length <= 5,
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

    // DEBUG send email
    @prop({ required: true, default: false })
    public isApproved!: boolean;
}
