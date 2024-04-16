import { Request, Response, Router } from "express";
import { checkSchema } from "express-validator";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "http-status";
import { logger } from "../../../shared";
import { createError, validate } from "../../helpers";
import { Errors } from "../../errors";
import createSchema from "../schemas/createSchema";
import { User, UserDoc } from "../../auth/models";
import { BlogPost } from "../models";
import fileUpload from "express-fileupload";
import { s3Client as s3 } from "../../aws";
import { stat, unlink } from "fs/promises";
import sharp from "sharp";

const router = Router();

/**
 * @openapi
 * /api/blog:
 *  post:
 *    summary: Creates a new blog post, add "content" with files to upload, "postPic" with post pic to upload
 *    requestBody:
 *      required: true
 *      content:
 *        application/x-www-form-urlencoded:
 *          schema:
 *            $ref: '#/components/schemas/BlogPost'
 *    tags:
 *      - blog
 *    responses:
 *      '200':
 *        description: Post created
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/BlogPost'
 *      '400':
 *        description: Data validation failed
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
    "/",
    checkSchema(createSchema),
    validate,
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new Error("No req.user in blog post create");
        }

        logger.debug("Creating blog post");

        const _imgs = req.files?.content ?? [];
        const imgs: fileUpload.UploadedFile[] = Array.isArray(_imgs)
            ? _imgs
            : [_imgs];

        const _postPic = req.files?.postPic ?? [];
        const postPic: fileUpload.UploadedFile | undefined = Array.isArray(
            _postPic
        )
            ? _postPic[0]
            : _postPic;

        try {
            const user = await User.findOne({
                _id: (req.user as unknown as UserDoc)._id
            });
            if (!user) {
                throw new Error("User not found in blog post create");
            } else if (!user.isAdmin) {
                logger.warn(
                    "Non-admin tried to create a blog post: " + user._id
                );
                return res
                    .status(BAD_REQUEST)
                    .json(createError(Errors.NOT_AN_ADMIN));
            }

            const { title, contentMd } = req.body;
            const tags = JSON.parse(req.body.tags);

            const blogPost = new BlogPost({
                title,
                contentMd,
                tags,
                fromUser: user._id,
                fileContents: []
            });

            for (const f of [postPic, ...imgs].filter(f => f)) {
                const originalStat = await stat(f.tempFilePath);
                const originalSizeKb = originalStat.size / 1024;

                if (originalSizeKb > 1024 * 3) {
                    logger.debug(`Compressing picture ${f.tempFilePath}`);
                    const minifiedPath = f.tempFilePath + ".min.jpg";
                    await sharp(f.tempFilePath)
                        .jpeg({ quality: 80 })
                        .toFile(f.tempFilePath);

                    const newStat = await stat(minifiedPath);
                    const newSizeKb = newStat.size / 1024;

                    logger.info(
                        `Minified picture for blog post ${blogPost._id} saved to ${minifiedPath} (${originalSizeKb}Kb -> ${newSizeKb}Kb)`
                    );
                    await unlink(f.tempFilePath);
                    f.tempFilePath = minifiedPath;
                } else {
                    logger.info(
                        `Picture ${f.tempFilePath} is small enough (${originalSizeKb}Kb), not minifying`
                    );
                }

                const awsPath = await s3.uploadFile({
                    fileName: s3.generateFileName({
                        userId: user._id.toString(),
                        mimeType: f.mimetype
                    }),
                    filePath: f.tempFilePath,
                    mimeType: f.mimetype,
                    folder: "pics"
                });

                logger.info(
                    `Minified file for blog post ${blogPost._id} uploaded to ${awsPath}`
                );

                if (f.md5 === postPic?.md5) {
                    logger.debug("Setting post pic to " + awsPath);
                    blogPost.image = awsPath;
                }
                logger.debug("Adding file to post: " + awsPath);
                blogPost.fileContents.push(awsPath);
            }

            if (tags.length < 1) {
                return res
                    .status(BAD_REQUEST)
                    .json(createError(Errors.INVALID_TAGS));
            }

            try {
                await blogPost.validate();
            } catch (err) {
                logger.debug("Error while validating post");
                logger.debug(err);
                return res
                    .status(BAD_REQUEST)
                    .json(createError(Errors.INVALID_POST));
            }

            await blogPost.save();

            res.json(blogPost.toObject());
        } catch (err) {
            logger.error("Error while creating blog post");
            logger.error(err);
            res.status(INTERNAL_SERVER_ERROR).json(createError());
        }
    }
);

export default router;
