import { Request, Response, Router } from "express";
import { checkSchema } from "express-validator";
import createSchema from "./createSchema";
import { createError, validate } from "../../../helpers";
import { logger } from "../../../../shared";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "http-status";
import { S3Client } from "../../../aws";
import { Errors } from "../../../errors";
import User, { UserDoc } from "../../../auth/models";
import { MyFlashMobPost } from "../../models";

const router = Router();

const s3 = new S3Client();

/**
 * @openapi
 * /post/myflashmob:
 *  post:
 *    summary: Creates a new My Flash Mob post
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *           type: object
 *           required:
 *             - description
 *             - filesPath
 *           properties:
 *             description:
 *               type: string
 *               minLength: 1
 *               description: Description of the event
 *             filesPath:
 *               type: array
 *               items:
 *                 type: string
 *               description: Paths of the files uploaded by the user
 *    tags:
 *      - post
 *    responses:
 *      '200':
 *        description: Post created successfully
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Post'
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
            throw new Error("No req.user in post create");
        }
        try {
            const user = await User.findOne({
                _id: (req.user as unknown as UserDoc)._id
            });
            if (!user) {
                throw new Error("User not found in post create");
            }

            const { description, filesPath } = req.body;

            logger.info("Checking files");

            const metas: [path: string, meta: AWS.S3.HeadObjectOutput][] = [];
            for (const _p of filesPath) {
                const p = _p.split("/").slice(-2).join("/");
                logger.debug("Getting meta of file " + p);
                try {
                    const meta = await s3.getFileMeta({ filePath: p });
                    metas.push([_p, meta]);
                } catch (err) {
                    if ((err as Error).name === "NotFound") {
                        logger.debug("File not found");
                        return res
                            .status(BAD_REQUEST)
                            .json(createError(Errors.FILE_NOT_FOUND));
                    }
                    logger.error(
                        `Error while getting file meta for file "${_p} ("${p}")`
                    );
                    logger.error(err);
                    return res
                        .status(INTERNAL_SERVER_ERROR)
                        .json(createError());
                }
            }

            const pictures: string[] = [];
            const videos: string[] = [];
            for (const [path, m] of metas) {
                if (m.ContentType?.includes("image")) {
                    pictures.push(path);
                } else if (m.ContentType?.includes("video")) {
                    videos.push(path);
                } else {
                    logger.error("Error while reading meta of file");
                    logger.error(path);
                    // DEBUG delete all other files
                    return res
                        .status(INTERNAL_SERVER_ERROR)
                        .json(createError());
                }
            }

            if (pictures.length > 10) {
                return res
                    .status(BAD_REQUEST)
                    .json(createError(Errors.INVALID_PICS_NUM));
            } else if (videos.length > 2) {
                return res
                    .status(BAD_REQUEST)
                    .json(createError(Errors.INVALID_VIDS_NUM));
            }

            logger.info("Creating post with following params");
            logger.info({
                fromUser: user._id,
                description,
                pictures,
                videos
            });
            logger.debug("fromUser");
            logger.debug(user);
            const post = new MyFlashMobPost({
                fromUser: user._id,
                postType: "myFlashMobPost",
                description,
                isApproved: true,
                pictures,
                videos
            });
            try {
                await post.validate();
            } catch (err) {
                logger.error("Error while validating post");
                logger.error(err);
                return res
                    .status(BAD_REQUEST)
                    .json(createError(Errors.INVALID_POST));
            }

            // user.posts.push(post._id);
            // await user.save();
            await post.save();
            await User.updateOne(
                { _id: user._id },
                { $push: { posts: post._id } }
            );

            res.json(post.toObject());
        } catch (err) {
            logger.error("Error while creating post");
            logger.error(err);
            res.status(INTERNAL_SERVER_ERROR).json(createError());
        }
    }
);

export default router;
