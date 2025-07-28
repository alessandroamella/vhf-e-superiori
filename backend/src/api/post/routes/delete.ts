import { isDocument } from "@typegoose/typegoose";
import { Request, Response, Router } from "express";
import { param } from "express-validator";
import {
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  OK,
  UNAUTHORIZED,
} from "http-status";
import { logger } from "../../../shared";
import { s3Client } from "../../aws";
import { Comment } from "../../comment/models";
import { Errors } from "../../errors";
import { createError, validate } from "../../helpers";
import { BasePost } from "../models";

const router = Router();

/**
 * @openapi
 * /api/post/{id}:
 *  delete:
 *    summary: Deletes an existing post (must be post owner or admin)
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *          format: ObjectId
 *        required: true
 *        description: ObjectId of the post to delete
 *    tags:
 *      - post
 *    responses:
 *      '200':
 *        description: Post deleted successfully
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
    try {
      const post = await BasePost.findOne({
        _id: req.params._id,
      }).populate("fromUser");

      if (!post) {
        return res.status(BAD_REQUEST).json(createError(Errors.POST_NOT_FOUND));
      }

      const comments = await Comment.find({
        forPost: post._id,
      });

      if (!isDocument(post?.fromUser)) {
        logger.error("Post fromUser not populated");
      } else {
        const reqUser = req.user;
        const user = post.fromUser;

        logger.debug(`Delete post isAdmin: ${reqUser?.isAdmin}`);
        logger.debug(
          `Delete post _id match: ${user._id.toString()} === ${typeof reqUser?._id?.toString()} (${
            user._id.toString() === reqUser?._id?.toString()
          }`,
        );
        if (!reqUser) {
          return res
            .status(UNAUTHORIZED)
            .json(createError(Errors.NOT_LOGGED_IN));
        } else if (
          !reqUser?.isAdmin &&
          user._id.toString() !== reqUser?._id?.toString()
        ) {
          return res
            .status(UNAUTHORIZED)
            .json(createError(Errors.MUST_BE_POST_OWNER));
        }

        await user.save();
      }

      for (const comment of comments) {
        await comment.deleteOne();
      }

      const filePaths = [...post.pictures, ...post.videos].map((url) => {
        const parts = url.split("/");
        return parts.slice(-2).join("/");
      });
      logger.info(
        `Post delete deleting files from S3: ${filePaths.join(", ")}`,
      );
      s3Client.deleteMultiple({ filePaths });

      await post.deleteOne();
      res.sendStatus(OK);
    } catch (err) {
      logger.error("Error while deleting post");
      logger.error(err);
      res.status(INTERNAL_SERVER_ERROR).json(createError());
    }
  },
);

export default router;
