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
 *          - band
 *          - brand
 *          - metersFromSea
 *          - boomLengthCm
 *          - numberOfElements
 *          - numberOfAntennas
 *          - cable
 *          - pictures
 *          - videos
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
 *          band:
 *            type: string
 *            enum: [144, 432, 1200]
 *            description: Frequency band of the antenna
 *          brand:
 *            type: string
 *            minLength: 0
 *            maxLength: 30
 *            description: Brand of the antenna
 *          isSelfBuilt:
 *            type: boolean
 *            description: Whether this antenna was self built
 *          metersFromSea:
 *            type: number
 *            maximum: 10000
 *            description: Height from sea level (in meters)
 *          boomLengthCm:
 *            type: number
 *            minimum: 0
 *            maximum: 100000
 *            description: Length of the boom (in centimeters)
 *          numberOfElements:
 *            type: integer
 *            minimum: 1
 *            maximum: 300
 *            description: Number of elements of this antenna
 *          numberOfAntennas:
 *            type: integer
 *            minimum: 0
 *            maximum: 100
 *            description: Number of coupled antennas (0 if none)
 *          cable:
 *            type: string
 *            minLength: 0
 *            maxLength: 100
 *            description: Brand, type, length... of the cable used for this antenna
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
    options: { customName: "Post" }
})
export class PostClass {
    @prop({ required: true, ref: "User" })
    public fromUser!: Ref<"User">;

    @prop({ required: true, maxlength: 30 })
    public description!: string;

    @prop({ required: true, enum: ["144", "432", "1200"] })
    public band!: string;

    @prop({ required: true, minlength: 0, maxlength: 30 })
    public brand!: string;

    @prop({ required: true })
    public isSelfBuilt!: boolean;

    @prop({ required: true, max: 10000 })
    public metersFromSea!: number;

    @prop({ required: true, min: 0, max: 100000 })
    public boomLengthCm!: number;

    @prop({ required: true, min: 1, max: 300 })
    public numberOfElements!: number;

    @prop({ required: true, min: 0, max: 100 })
    public numberOfAntennas!: number;

    @prop({ required: true, minlength: 0, maxlength: 100 })
    public cable!: string;

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
