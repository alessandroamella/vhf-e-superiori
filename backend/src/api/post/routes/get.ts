import { isDocument } from "@typegoose/typegoose";
import { Router } from "express";
import { param } from "express-validator";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "http-status";
import { logger } from "../../../shared/logger";
import { UserDoc } from "../../auth/models";
import { Errors } from "../../errors";
import { createError, validate } from "../../helpers";
import { qrz } from "../../qrz";
import { BasePost } from "../models";
import { Comment } from "../../comment/models";

const router = Router();

/**
 * @openapi
 * /post/{id}:
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
 *        description: Invalid ObjectId or post not found
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
router.get("/:_id", param("_id").isMongoId(), validate, async (req, res) => {
    try {
        const post = await BasePost.findOne({ _id: req.params?._id })
            .populate({ path: "fromUser", select: "callsign name" })
            .populate({
                path: "comments",
                select: "fromUser content createdAt"
            })
            .sort({ "comments.createdAt": -1 });
        await Comment.populate(post, {
            path: "comments.fromUser",
            model: "User",
            select: "callsign name"
        });

        logger.debug("Fetched post " + post?._id);

        if (!post) {
            return res
                .status(BAD_REQUEST)
                .json(createError(Errors.POST_NOT_FOUND));
        } else if (!isDocument(post.fromUser)) {
            return res
                .status(BAD_REQUEST)
                .json(createError(Errors.USER_NOT_FOUND));
        }

        const pp = await qrz.scrapeProfilePicture(
            (post.fromUser as unknown as UserDoc).callsign
        );

        res.json({
            post: post.toObject(),
            pp
        });
    } catch (err) {
        logger.error("Error in post get");
        logger.error(err);
        return res.status(INTERNAL_SERVER_ERROR).json(createError());
    }
});

export default router;
