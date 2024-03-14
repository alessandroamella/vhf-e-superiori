import { Request, Response, Router } from "express";
import { createError, validate } from "../../helpers";
import { logger } from "../../../shared";
import { INTERNAL_SERVER_ERROR, OK } from "http-status";
import { param } from "express-validator";
import { Comment } from "../models";
import User, { UserDoc } from "../../auth/models";
import { Errors } from "../../errors";
import { BasePost } from "../../post/models";

const router = Router();

/**
 * @openapi
 * /api/comment/{id}:
 *  delete:
 *    summary: Deletes an existing comment
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *          format: ObjectId
 *        required: true
 *        description: ObjectId of the comment to delete
 *    tags:
 *      - comment
 *    responses:
 *      '200':
 *        description: Comment deleted successfully
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
        const reqUser = req.user as unknown as UserDoc;
        const isAdmin = reqUser.isAdmin;
        try {
            const comment = await Comment.findOne({
                _id: req.params._id
            }).populate({ path: "fromUser", select: "callsign" });

            if (!comment) {
                logger.error("Comment not found");
                return res
                    .status(INTERNAL_SERVER_ERROR)
                    .json(createError(Errors.COMMENT_NOT_FOUND));
            }
            if (
                !isAdmin &&
                comment.fromUser._id.toString() !== reqUser._id.toString()
            ) {
                logger.debug("Not authorized to delete comment");
                return res
                    .status(INTERNAL_SERVER_ERROR)
                    .json(createError(Errors.COMMENT_NOT_OWNED));
            }

            await comment.deleteOne();

            logger.info(`Comment ${comment._id} deleted successfully`);

            res.sendStatus(OK);
        } catch (err) {
            logger.error("Error while deleting comment");
            logger.error(err);
            res.status(INTERNAL_SERVER_ERROR).json(createError());
        }
    }
);

export default router;
