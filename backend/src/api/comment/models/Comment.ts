import { modelOptions, prop, Ref } from "@typegoose/typegoose";

/**
 * @swagger
 *  components:
 *    schemas:
 *      Comment:
 *        type: object
 *        required:
 *          - fromUser
 *          - forPost
 *          - content
 *          - createdAt
 *          - updatedAt
 *        properties:
 *          fromUser:
 *            type: string
 *            format: objectid
 *            description: ObjectId of the user who made this post
 *          forPost:
 *            type: string
 *            format: objectid
 *            description: ObjectId of the post this comment is for
 *          content:
 *            type: string
 *            minLength: 1
 *            maxLength: 300
 *            description: Content of the comment
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
    options: { customName: "Comment" }
})
export class CommentClass {
    @prop({ required: true, ref: "User" })
    public fromUser!: Ref<"User">;

    @prop({ required: true, ref: "Post" })
    public forPost!: Ref<"Post">;

    @prop({ required: true, minlength: 1, maxlength: 300 })
    public content!: string;
}
