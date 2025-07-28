import { Request, Response, Router } from "express";
import { checkSchema } from "express-validator";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "http-status";
import { envs, logger } from "../../../shared";
import { User, UserDoc } from "../../auth/models";
import EmailService from "../../email";
import { Errors } from "../../errors";
import { createError, validate } from "../../helpers";
import { BasePost } from "../../post/models";
import { Comment, CommentDoc } from "../models";
import createSchema from "../schemas/createSchema";

const router = Router();

/**
 * @openapi
 * /api/comment:
 *  post:
 *    summary: Creates a new comment
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Comment'
 *    tags:
 *      - comment
 *    responses:
 *      '200':
 *        description: Comment created successfully
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Comment'
 *      '400':
 *        description: Data validation failed
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ResErr'
 *      '401':
 *        description: Not logged in
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ResErr'
 *      '500':
 *        description: Server error
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ResErr'
 */
router.post(
  "/",
  checkSchema(createSchema),
  validate,
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error("No req.user in comment create");
    }
    try {
      const user = await User.findOne({
        _id: (req.user as unknown as UserDoc)._id,
      });
      if (!user) {
        throw new Error("User not found in post create");
      }

      const { forPost, content, parentComment } = req.body;

      const post = await BasePost.findById(forPost);
      if (!post) {
        return res.status(BAD_REQUEST).json(createError(Errors.INVALID_POST));
      }

      const postUser = await User.findById(post.fromUser);
      if (!postUser) {
        logger.error("Post user not found in comment create");
        return res.status(INTERNAL_SERVER_ERROR).json(createError());
      }

      let parentCommentDoc: CommentDoc | null = null;
      if (parentComment) {
        parentCommentDoc = await Comment.findOne({
          _id: parentComment,
          forPost: post._id,
        });
        logger.debug("Parent comment found: " + parentCommentDoc);
        if (!parentCommentDoc) {
          return res
            .status(BAD_REQUEST)
            .json(createError(Errors.COMMENT_NOT_FOUND));
        }

        // don't allow replying to a comment that is a reply
        const superParentComment = await Comment.findOne({
          replies: parentComment,
        });

        if (superParentComment) {
          // find the parent comment
          parentCommentDoc = superParentComment;
          logger.debug(
            "Parent comment is a reply, super parent comment: " +
              superParentComment,
          );
        }
      }

      const comment = await new Comment({
        fromUser: user._id,
        forPost: post._id,
        content,
      }).populate({
        path: "fromUser",
        select: "callsign name isDev isAdmin",
      });

      try {
        await comment.validate();
      } catch (err) {
        logger.debug("Error while validating comment");
        logger.debug(err);
        return res
          .status(BAD_REQUEST)
          .json(createError(Errors.INVALID_COMMENT));
      }

      if (parentCommentDoc) {
        if (parentCommentDoc.replies) {
          parentCommentDoc.replies.push(comment);
        } else {
          parentCommentDoc.replies = [comment];
        }
        await parentCommentDoc.save();
      }

      await comment.save();

      const parentDocAuthor =
        parentCommentDoc && (await User.findById(parentCommentDoc?.fromUser));

      const forUser = parentDocAuthor || postUser;

      // don't await this
      if (envs.NODE_ENV === "development") {
        logger.warn(
          `Skipping comment email in development for comment ${comment}`,
        );
      } else if (user.email === forUser.email) {
        logger.debug(`Not sending email to self (${user.email})`);
      } else {
        EmailService.sendCommentMail(
          user,
          forUser,
          post,
          comment,
          parentDocAuthor && parentComment,
        )
          .then(() => {
            logger.debug("Comment email sent successfully");
          })
          .catch((err) => {
            logger.error("Error while sending comment email");
            logger.error(err);
          });
      }

      res.json({
        parentComment: parentCommentDoc?._id || null,
        ...comment.toObject(),
      });
    } catch (err) {
      logger.error("Error while creating comment");
      logger.error(err);
      res.status(INTERNAL_SERVER_ERROR).json(createError());
    }
  },
);

export default router;
