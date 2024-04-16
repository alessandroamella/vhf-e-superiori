import { Request, Response, Router } from "express";
import { createError, validate } from "../../helpers";
import { logger } from "../../../shared";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, OK } from "http-status";
import { param } from "express-validator";
import { Errors } from "../../errors";
import { BlogPost } from "../models";

const router = Router();

/**
 * @openapi
 * /api/blog/{id}:
 *  delete:
 *    summary: Deletes an existing blog post (must be admin)
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *          format: ObjectId
 *        required: true
 *        description: ObjectId of the blog post to delete
 *    tags:
 *      - blog
 *    responses:
 *      '200':
 *        description: Blog post deleted successfully
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
            const post = await BlogPost.findOne({
                _id: req.params._id
            });

            if (!post) {
                return res
                    .status(BAD_REQUEST)
                    .json(createError(Errors.POST_NOT_FOUND));
            }

            await post.deleteOne();
            res.sendStatus(OK);
        } catch (err) {
            logger.error("Error while deleting blog post");
            logger.error(err);
            res.status(INTERNAL_SERVER_ERROR).json(createError());
        }
    }
);

export default router;
