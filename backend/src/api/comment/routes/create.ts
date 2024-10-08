import { Request, Response, Router } from "express";
import { checkSchema } from "express-validator";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "http-status";
import { logger } from "../../../shared";
import { createError, validate } from "../../helpers";
import { Errors } from "../../errors";
import createSchema from "../schemas/createSchema";
import { User, UserDoc } from "../../auth/models";
import { BasePost } from "../../post/models";
import { Comment } from "../models";
import EmailService from "../../email";

const router = Router();

/**
 * @openapi
 * /api/comment:
 *  post:
 *    summary: Creates a new comment
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Comment'
 *    tags:
 *      - comment
 *    responses:
 *      '200':
 *        description: Comment created successfully
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Comment'
 *      '400':
 *        description: Data validation failed
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ResErr'
 *      '401':
 *        description: Not logged in
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
    "/",
    checkSchema(createSchema),
    validate,
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new Error("No req.user in comment create");
        }
        try {
            const user = await User.findOne({
                _id: (req.user as unknown as UserDoc)._id
            });
            if (!user) {
                throw new Error("User not found in post create");
            }

            const { forPost, content } = req.body;

            const post = await BasePost.findById(forPost);
            if (!post) {
                return res
                    .status(BAD_REQUEST)
                    .json(createError(Errors.INVALID_POST));
            }

            const comment = await new Comment({
                fromUser: user._id,
                forPost: post._id,
                content
            }).populate({ path: "fromUser", select: "callsign name" });

            try {
                await comment.validate();
            } catch (err) {
                logger.debug("Error while validating comment");
                logger.debug(err);
                return res
                    .status(BAD_REQUEST)
                    .json(createError(Errors.INVALID_COMMENT));
            }

            // user.posts.push(post._id);
            // await user.save();
            await comment.save();

            const postUser = await User.findById(post.fromUser);
            if (!postUser) {
                throw new Error("Post user not found in comment create");
            }
            await EmailService.sendCommentMail(postUser, user, post, comment);

            res.json(comment.toObject());
        } catch (err) {
            logger.error("Error while creating comment");
            logger.error(err);
            res.status(INTERNAL_SERVER_ERROR).json(createError());
        }
    }
);

export default router;
