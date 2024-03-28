import { Router } from "express";
import { query } from "express-validator";
import { INTERNAL_SERVER_ERROR } from "http-status";
import { logger } from "../../../shared/logger";
import { UserDoc } from "../../auth/models";
import { createError, validate } from "../../helpers";
import { qrz } from "../../qrz";
import { BasePost } from "../models";
import { Comment } from "../../comment/models";
import { FilterQuery, isValidObjectId } from "mongoose";
import { BasePostClass } from "../models/BasePost";

const router = Router();

/**
 * @openapi
 * /api/post:
 *  get:
 *    summary: Get posts and related profile pictures from QRZ
 *    parameters:
 *      - in: query
 *        name: limit
 *        schema:
 *          type: integer
 *          minimum: 1
 *          maximum: 100
 *        description: Number of posts to return
 *        required: false
 *      - in: query
 *        name: offset
 *        schema:
 *          type: integer
 *          minimum: 0
 *        description: Number of posts to skip
 *        required: false
 *      - in: query
 *        name: fromUser
 *        schema:
 *          type: string
 *          format: ObjectId
 *        description: ObjectId of the user to filter by
 *        required: false
 *    tags:
 *      - post
 *    responses:
 *      '200':
 *        description: Posts
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                posts:
 *                  type: array
 *                  items:
 *                    $ref: '#/components/schemas/Post'
 *                pp:
 *                  type: array
 *                  items:
 *                    type: object
 *                    properties:
 *                      callsign: string
 *                      url: string
 *      '400':
 *        description: Query params not provided
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
    "/",
    query("limit").isInt({ gt: 0, max: 100 }).optional(),
    query("offset").isInt({ min: 0 }).optional(),
    query("fromUser").isMongoId().optional(),
    validate,
    async (req, res) => {
        try {
            const query: FilterQuery<BasePostClass> = {
                isProcessing: false,
                hidden: false
            };
            if (
                typeof req.query?.fromUser === "string" &&
                isValidObjectId(req.query.fromUser)
            ) {
                query.fromUser = req.query.fromUser;
            }
            const postsQuery = BasePost.find(query).populate({
                path: "fromUser",
                select: "callsign name"
            });

            if (
                typeof req.query?.limit === "string" &&
                !Number.isNaN(parseInt(req.query.limit))
            )
                postsQuery.limit(parseInt(req.query.limit));

            if (
                typeof req.query?.offset === "string" &&
                !Number.isNaN(parseInt(req.query.offset))
            )
                postsQuery.skip(parseInt(req.query.offset));

            const posts = await postsQuery
                .sort({ createdAt: -1 })
                .sort({ "comments.createdAt": -1 })
                .exec();

            const comments = await Comment.find({
                forPost: { $in: posts.map(p => p._id) }
            }).populate({ path: "fromUser", select: "callsign name" });

            logger.debug("Fetched " + posts.length + " posts");

            const callsigns = [
                ...new Set(
                    posts
                        .map(p => (p.fromUser as unknown as UserDoc)?.callsign)
                        .filter(c => c)
                )
            ];
            const promiseUrls = callsigns.map(c => qrz.getInfo(c));
            const users = await Promise.all(promiseUrls);
            const urls = users.map(u => u?.pictureUrl);

            const pps = callsigns.map((c, i) => ({
                callsign: c,
                url: urls[i]
            }));

            const postsMapped = posts.map(p => {
                const _comments = comments.filter(
                    c => c.forPost.toString() === p._id.toString()
                );
                return {
                    ...p.toJSON(),
                    comments: _comments
                };
            });

            res.json({
                posts: postsMapped,
                pp: pps.filter(p => p.url)
            });
        } catch (err) {
            logger.error("Error in posts get");
            logger.error(err);
            return res.status(INTERNAL_SERVER_ERROR).json(createError());
        }
    }
);

export default router;
