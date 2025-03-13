import { isDocument } from "@typegoose/typegoose";
import { Router } from "express";
import { param } from "express-validator";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND } from "http-status";
import { logger } from "../../../shared/logger";
import type { UserDoc } from "../../auth/models";
import { Comment } from "../../comment/models";
import { Errors } from "../../errors";
import { createError, validate } from "../../helpers";
import { qrz } from "../../qrz";
import { BasePost } from "../models";

const router = Router();

/**
 * @openapi
 * /api/post/{id}:
 *  get:
 *    summary: Get a post and the related profile pictures from QRZ
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *        required: true
 *        description: ObjectId of the post to find
 *    tags:
 *      - post
 *    responses:
 *      '200':
 *        description: Post
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - post
 *              properties:
 *                post:
 *                  $ref: '#/components/schemas/Post'
 *                pp:
 *                  type: string
 *      '400':
 *        description: Invalid ObjectId
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ResErr'
 *      '404':
 *        description: Post not found
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
router.get(
    "/:_id",
    param("_id", "Post ID is invalid").isMongoId(),
    validate,
    async (req, res) => {
        try {
            const post = await BasePost.findOne({
                _id: req.params?._id,
                isProcessing: false,
                hidden: false
            }).populate({
                path: "fromUser",
                select: "callsign name"
            });
            if (post?.isProcessing) {
                return res
                    .status(BAD_REQUEST)
                    .json(createError(Errors.POST_IS_PROCESSING));
            }

            if (!post) {
                return res
                    .status(NOT_FOUND)
                    .json(createError(Errors.POST_NOT_FOUND));
            } else if (!isDocument(post.fromUser)) {
                return res
                    .status(BAD_REQUEST)
                    .json(createError(Errors.USER_NOT_FOUND));
            }

            logger.debug("Fetched post " + post?._id);

            const comments = await Comment.find({
                forPost: post._id
            }).populate({ path: "fromUser", select: "callsign name" });

            const pp = (
                await qrz.getInfo(
                    (post.fromUser as unknown as UserDoc).callsign
                )
            )?.pictureUrl;

            res.json({
                post: { ...post.toJSON(), comments },
                pp
            });
        } catch (err) {
            logger.error("Error in post get");
            logger.error(err);
            return res.status(INTERNAL_SERVER_ERROR).json(createError());
        }
    }
);

export default router;
