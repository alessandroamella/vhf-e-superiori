import { Request, Response, Router } from "express";
import { param } from "express-validator";
import { INTERNAL_SERVER_ERROR } from "http-status";
import { logger } from "../../../shared";
import type { UserDoc } from "../../auth/models";
import { Errors } from "../../errors";
import { createError, validate } from "../../helpers";
import { Comment } from "../models";

const router = Router();

/**
 * @openapi
 * /api/comment/{id}:
 *  delete:
 *    summary: Deletes an existing comment
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *          format: ObjectId
 *        required: true
 *        description: ObjectId of the comment to delete
 *    tags:
 *      - comment
 *    responses:
 *      '200':
 *        description: Comment deleted successfully
 *      '401':
 *        description: Not logged in or not an admin
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
router.delete(
  "/:_id",
  param("_id").isMongoId(),
  validate,
  async (req: Request, res: Response) => {
    if (!req.user) {
      logger.error("User not logged in");
      return res
        .status(INTERNAL_SERVER_ERROR)
        .json(createError(Errors.NOT_LOGGED_IN));
    }
    const isAdmin = req.user.isAdmin;
    try {
      const comment = await Comment.findOne({
        _id: req.params._id,
      }).populate({
        path: "fromUser",
        select: "callsign name isDev isAdmin",
      });

      if (!comment) {
        logger.error("Comment not found");
        return res
          .status(INTERNAL_SERVER_ERROR)
          .json(createError(Errors.COMMENT_NOT_FOUND));
      }
      if (
        !isAdmin &&
        comment.fromUser._id.toString() !== req.user._id.toString()
      ) {
        logger.debug("Not authorized to delete comment");
        return res
          .status(INTERNAL_SERVER_ERROR)
          .json(createError(Errors.COMMENT_NOT_OWNED));
      }

      // delete replies
      const replies = await Comment.deleteMany({
        _id: { $in: comment.replies },
      });

      // find if this comment was a reply to another comment
      const parentComment = await Comment.findOne({
        replies: comment._id,
      });
      if (parentComment?.replies) {
        parentComment.replies = parentComment.replies.filter(
          (reply) => reply.toString() !== comment._id.toString(),
        );
        await parentComment.save();
      }

      await comment.deleteOne();

      logger.info(
        `Comment ${comment._id} deleted successfully, deleted ${replies.deletedCount} replies`,
      );

      res.json({ parentComment: parentComment?._id || null });
    } catch (err) {
      logger.error("Error while deleting comment");
      logger.error(err);
      res.status(INTERNAL_SERVER_ERROR).json(createError());
    }
  },
);

export default router;
