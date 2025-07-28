import { modelOptions, pre, prop, Ref, Severity } from "@typegoose/typegoose";
import { logger } from "../../../shared";
import { UserClass } from "../../auth/models";
import { Errors } from "../../errors";

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
  if (
    this.pictures.length === 0 &&
    this.videos.length === 0 &&
    this.isProcessing === false
  ) {
    logger.error("No content uploaded for post " + this._id);
    next(new Error(Errors.NO_CONTENT));
  } else {
    next();
  }
})
@modelOptions({
  schemaOptions: { timestamps: true },
  options: { allowMixed: Severity.ERROR, customName: "BasePost" },
})
export class BasePostClass {
  @prop({ required: true, ref: UserClass })
  public fromUser!: Ref<UserClass>;

  @prop({ required: true, minlength: 1, maxlength: 300 })
  public description!: string;

  @prop({
    type: () => [String],
    required: true,
    validate: [
      (v: unknown[]) => v.length >= 0 && v.length <= 5,
      Errors.INVALID_PICS_NUM,
    ],
  })
  public pictures!: string[];

  @prop({
    type: () => [String],
    required: true,
    validate: [
      (v: unknown[]) => v.length >= 0 && v.length <= 2,
      Errors.INVALID_VIDS_NUM,
    ],
  })
  public videos!: string[];

  @prop({ required: true, default: true })
  public isProcessing!: boolean;

  @prop({ required: false, default: false })
  public hidden?: boolean;
}
