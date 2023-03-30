import { Request, Response, Router } from "express";
import { param } from "express-validator";
import { createError, validate } from "../../helpers";
import { logger } from "../../../shared";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, OK } from "http-status";
import { Errors } from "../../errors";
import Post from "../models";

const router = Router();

/**
 * @openapi
 * /post/approve/{id}:
 *  post:
 *    summary: Approves a post (must be admin)
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *          format: ObjectId
 *        required: true
 *        description: ObjectId of the post to approve
 *    tags:
 *      - post
 *    responses:
 *      '200':
 *        description: Post approved successfully
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Post'
 *      '400':
 *        description: Invalid ObjectId or post not found
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ResErr'
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
router.post(
    "/:id",
    param("id").isMongoId(),
    validate,
    async (req: Request, res: Response) => {
        try {
            const post = await Post.findOne({
                _id: req.params.id
            });
            if (!post) {
                return res
                    .status(BAD_REQUEST)
                    .json(createError(Errors.POST_NOT_FOUND));
            }
            post.isApproved = !post.isApproved;
            await post.save();
            logger.debug("Post approved / disapproved: " + req.params.id);
            return res.sendStatus(OK);
        } catch (err) {
            logger.error("Error while approving post");
            logger.error(err);
            res.status(INTERNAL_SERVER_ERROR).json(createError());
        }
    }
);

export default router;
