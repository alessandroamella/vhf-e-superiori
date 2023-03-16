import { Router } from "express";
import { query } from "express-validator";
import { INTERNAL_SERVER_ERROR } from "http-status";
import { logger } from "../../../shared/logger";
import { UserDoc } from "../../auth/models";
import { createError } from "../../helpers";
import { qrz } from "../../qrz";
import Post from "../models";

const router = Router();

/**
 * @openapi
 * /post:
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
 *        required: true
 *      - in: query
 *        name: offset
 *        schema:
 *          type: integer
 *          minimum: 0
 *        description: Number of posts to skip
 *        required: true
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
    query("limit").isInt({ gt: 0, max: 100 }),
    query("offset").isInt({ min: 0 }),
    async (req, res) => {
        try {
            const posts = await Post.find({ isApproved: true })
                .sort({ date: -1 })
                .populate("fromUser")
                .limit(req.query?.limit)
                .skip(req.query?.offset);

            logger.debug("Fetched " + posts.length + " posts");

            const callsigns = [
                ...new Set(
                    posts
                        .map(p => (p.fromUser as unknown as UserDoc)?.callsign)
                        .filter(c => c)
                )
            ];
            const promiseUrls = callsigns.map(c => qrz.scrapeProfilePicture(c));
            const urls = await Promise.all(promiseUrls);

            const pps = callsigns.map((c, i) => ({
                callsign: c,
                url: urls[i]
            }));

            res.json({
                posts,
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
