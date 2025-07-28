import { Router } from "express";
import { param } from "express-validator";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "http-status";
import { logger } from "../../../shared/logger";
import { Errors } from "../../errors";
import { createError, validate } from "../../helpers";
import { BlogPost } from "../models";

const router = Router();

/**
 * @openapi
 * /api/blog/{id}:
 *  get:
 *    summary: Gets a blog post
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *          format: ObjectId
 *        required: true
 *        description: ObjectId of the blog post to get
 *    tags:
 *      - blog
 *    responses:
 *      '200':
 *        description: Blog post
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/BlogPost'
 *      '500':
 *        description: Server error
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ResErr'
 */
router.get("/:_id", param("_id").isMongoId(), validate, async (req, res) => {
  try {
    const blogPost = await BlogPost.findOne({
      _id: req.params._id,
    }).populate({
      path: "fromUser",
      select: "callsign isDev isAdmin",
    });
    if (!blogPost) {
      return res.status(BAD_REQUEST).json(createError(Errors.POST_NOT_FOUND));
    }
    return res.json(blogPost);
  } catch (err) {
    logger.error("Error in blog post get");
    logger.error(err);
    return res.status(INTERNAL_SERVER_ERROR).json(createError());
  }
});

export default router;
