import { Router } from "express";
import { query } from "express-validator";
import { INTERNAL_SERVER_ERROR } from "http-status";
import { FilterQuery } from "mongoose";
import { logger } from "../../../shared/logger";
import { createError, validate } from "../../helpers";
import { BlogPost } from "../models";
import { BlogPostClass } from "../models/BlogPost";

const router = Router();

/**
 * @openapi
 * /api/blog:
 *  get:
 *    summary: Gets all blog posts, ordered by creation date (reverse order)
 *    parameters:
 *      - in: query
 *        name: limit
 *        schema:
 *          type: integer
 *        description: Number of posts to return (all if not specified)
 *        required: false
 *      - in: query
 *        name: offset
 *        schema:
 *          type: integer
 *        description: Number of blog posts to skip (0 if not specified)
 *        required: false
 *      - in: query
 *        name: q
 *        schema:
 *          type: string
 *        description: Search query
 *        required: false
 *      - in: query
 *        name: fromUser
 *        schema:
 *          type: string
 *          format: ObjectId
 *        description: User ID of the station that created the post
 *        required: false
 *    tags:
 *      - blog
 *    responses:
 *      '200':
 *        description: All blog posts
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/BlogPost'
 *      '500':
 *        description: Server error
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ResErr'
 */
router.get(
  "/",
  query("limit").optional().isInt().toInt(),
  query("offset").optional().isInt().toInt(),
  query("fromUser").optional().isMongoId(),
  query("q").optional().isString().trim().escape(),
  validate,
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) as number;
      const skip = parseInt(req.query.offset as string) as number;

      const query: FilterQuery<BlogPostClass> = {};
      if (req.query.fromUser) query.fromUser = req.query.fromUser;
      if (req.query.q) {
        query.$or = [
          { title: { $regex: req.query.q as string, $options: "i" } },
          {
            contentMd: {
              $regex: req.query.q as string,
              $options: "i",
            },
          },
        ];
      }

      const blogPostQuery = BlogPost.find(query);
      if (limit) blogPostQuery.limit(limit);
      if (skip) blogPostQuery.skip(skip);

      const blogPosts = await blogPostQuery
        .sort({ createdAt: -1 })
        .populate({
          path: "fromUser",
          select: "callsign isDev isAdmin",
        })
        .lean();

      res.json(blogPosts);
    } catch (err) {
      logger.error("Error in blog post all");
      logger.error(err);
      return res.status(INTERNAL_SERVER_ERROR).json(createError());
    }
  },
);

export default router;
