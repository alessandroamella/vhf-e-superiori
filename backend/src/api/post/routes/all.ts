import { Router } from "express";
import { query } from "express-validator";
import { INTERNAL_SERVER_ERROR } from "http-status";
import { FilterQuery, isValidObjectId } from "mongoose";
import { logger } from "../../../shared/logger";
import type { UserDoc } from "../../auth/models";
import { Comment } from "../../comment/models";
import { createError, validate } from "../../helpers";
import { qrz } from "../../qrz";
import { BasePost } from "../models";
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
 *      - in: query
 *        name: fromDate
 *        schema:
 *          type: string
 *          format: date-time
 *        description: Date to filter from
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
  query("orderBy").isObject().optional(),
  query("fromDate").isISO8601().optional(),
  validate,
  async (req, res) => {
    try {
      const query: FilterQuery<BasePostClass> = {
        isProcessing: false,
        hidden: false,
      };
      if (
        typeof req.query?.fromUser === "string" &&
        isValidObjectId(req.query.fromUser)
      ) {
        query.fromUser = req.query.fromUser;
      }
      if (
        typeof req.query?.fromDate === "string" &&
        !Number.isNaN(new Date(req.query.fromDate).valueOf())
      ) {
        query.createdAt = { $gt: new Date(req.query.fromDate) };
      }

      logger.debug("Get posts with query:");
      logger.debug(query);

      const postsQuery = BasePost.find(query).populate([
        {
          path: "fromUser",
          select: "callsign name isDev isAdmin",
        },
      ]);

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

      if (req.query.orderBy) {
        logger.debug("Order posts by:");
        logger.debug(req.query.orderBy);
      }

      // Parse orderBy parameter and ensure it's a valid sort object
      let sortOrder: Record<string, 1 | -1> = { createdAt: -1 };
      if (
        req.query.orderBy &&
        typeof req.query.orderBy === "object" &&
        !Array.isArray(req.query.orderBy)
      ) {
        try {
          // Convert ParsedQs to a proper sort object
          const orderByObj = req.query.orderBy as unknown as Record<
            string,
            string | number
          >;
          const validSortOrder: Record<string, 1 | -1> = {};

          for (const [key, value] of Object.entries(orderByObj)) {
            if (
              typeof key === "string" &&
              (value === 1 || value === -1 || value === "1" || value === "-1")
            ) {
              validSortOrder[key] =
                typeof value === "string" ? (parseInt(value) as 1 | -1) : value;
            }
          }

          if (Object.keys(validSortOrder).length > 0) {
            sortOrder = validSortOrder;
          }
        } catch {
          logger.warn("Invalid orderBy parameter, using default sort");
        }
      }

      const posts = await postsQuery
        .sort(sortOrder)
        .sort({ "comments.createdAt": -1 })
        .exec();

      const comments = await Comment.find({
        forPost: { $in: posts.map((p) => p._id) },
      }).populate({
        path: "fromUser",
        select: "callsign name isDev isAdmin",
      });

      logger.debug(`Fetched ${posts.length} posts`);

      const callsigns = [
        ...new Set(
          posts
            .map((p) => (p.fromUser as unknown as UserDoc)?.callsign)
            .filter(Boolean),
        ),
      ];
      const promiseUrls = callsigns.map((c) => qrz.getInfo(c));
      const users = await Promise.all(promiseUrls);
      const urls = users.map((u) => u?.pictureUrl);

      const pps = callsigns.map((c, i) => ({
        callsign: c,
        url: urls[i],
      }));

      const postsMapped = posts.map((p) => {
        const _comments = comments.filter(
          (c) => c.forPost.toString() === p._id.toString(),
        );
        return {
          ...p.toJSON(),
          comments: _comments,
        };
      });

      res.json({
        posts: postsMapped,
        pp: pps.filter((p) => p.url),
      });
    } catch (err) {
      logger.error("Error in posts get");
      logger.error(err);
      return res.status(INTERNAL_SERVER_ERROR).json(createError());
    }
  },
);

export default router;
