import { modelOptions, prop, Ref, Severity } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { UserClass } from "../../auth/models";

/**
 * @swagger
 *  components:
 *    schemas:
 *      BlogPost:
 *        type: object
 *        required:
 *          - fromUser
 *          - title
 *          - contentMd
 *        properties:
 *          fromUser:
 *            type: string
 *            description: The user who created the post
 *          title:
 *            type: string
 *            description: The title of the post
 *            minLength: 1
 *            maxLength: 100
 *          contentMd:
 *            type: string
 *            description: The content of the post in markdown
 *          image:
 *            type: string
 *            format: uri
 *            description: The image for the post
 */

@modelOptions({
  schemaOptions: { timestamps: true },
  options: { allowMixed: Severity.ERROR, customName: "BlogPost" },
})
export class BlogPostClass {
  // fromStation is User ref
  @prop({ required: true, ref: () => UserClass })
  public fromUser!: Ref<UserClass>;

  @prop({ required: true })
  public title!: string;

  @prop({ required: true })
  public contentMd!: string; // content in markdown

  @prop({ required: true, default: [], type: String })
  public tags!: mongoose.Types.Array<string>; // tags for the post

  @prop({ required: false })
  public image?: string; // image for the post

  @prop({ required: true, default: [], type: String })
  public fileContents!: mongoose.Types.Array<string>;

  @prop({ required: true, ref: () => UserClass })
  public comments!: Ref<UserClass>[];
}
