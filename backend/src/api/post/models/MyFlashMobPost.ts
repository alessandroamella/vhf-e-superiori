import { modelOptions, prop, Severity } from "@typegoose/typegoose";
import { BasePostClass } from "./BasePost";

/**
 * @swagger
 *  components:
 *    schemas:
 *      MyFlashMobPost:
 *        type: object
 *        required:
 *          - fromUser
 *          - postType
 *          - description
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
 *          description:
 *            type: string
 *            minLength: 1
 *            maxLength: 300
 *            description: Description of the post
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
    options: { allowMixed: Severity.ERROR, customName: "MyFlashMobPost" }
})
export class MyFlashMobPostClass extends BasePostClass {
    @prop({ required: true, minlength: 1, maxlength: 300 })
    public description!: string;
}
