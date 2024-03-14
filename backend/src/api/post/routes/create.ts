import { Request, Response, Router } from "express";
import { checkSchema } from "express-validator";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "http-status";
import { s3Client as s3 } from "../../aws";
import { BasePost } from "../models";
import { logger } from "../../../shared";
import { createError, validate } from "../../helpers";
import { Errors } from "../../errors";
import createSchema from "../schemas/createSchema";
import User, { UserDoc } from "../../auth/models";
import fileUpload from "express-fileupload";
import VideoCompressor from "../../compressor";
import sharp from "sharp";
import { stat, unlink } from "fs/promises";

const router = Router();

/**
 * @openapi
 * /api/post:
 *  post:
 *    summary: Creates a new post
 *    requestBody:
 *      required: true
 *      content:
 *        application/x-www-form-urlencoded:
 *          schema:
 *           type: object
 *           required:
 *             - description
 *             - files
 *           properties:
 *             description:
 *               type: string
 *               minLength: 1
 *               description: Description of the event
 *             files:
 *               type: array
 *               items:
 *                 type: string
 *                 format: binary
 *               description: Pictures or vidTempPaths of the post
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
        let responseSent = false;

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

            const { description } = req.body;

            const _files = req.files?.content ?? [];
            const files: fileUpload.UploadedFile[] = Array.isArray(_files)
                ? _files
                : [_files];

            logger.info("Checking files: ");
            logger.info(files);

            const picTempPaths: string[] = [];
            const vidTempPaths: string[] = [];

            for (const f of files) {
                if (f.mimetype.includes("image")) {
                    picTempPaths.push(f.tempFilePath);
                } else if (f.mimetype.includes("video")) {
                    vidTempPaths.push(f.tempFilePath);
                } else {
                    logger.error("File MIME type not allowed");
                    return res
                        .status(BAD_REQUEST)
                        .json(createError(Errors.INVALID_FILE_MIME_TYPE));
                }
            }

            if (picTempPaths.length > 5) {
                return res
                    .status(BAD_REQUEST)
                    .json(createError(Errors.INVALID_PICS_NUM));
            } else if (vidTempPaths.length > 2) {
                return res
                    .status(BAD_REQUEST)
                    .json(createError(Errors.INVALID_VIDS_NUM));
            } else if (picTempPaths.length + vidTempPaths.length === 0) {
                return res
                    .status(BAD_REQUEST)
                    .json(createError(Errors.NO_CONTENT));
            }

            logger.debug("fromUser");
            logger.debug(user);
            const post = new BasePost({
                fromUser: user._id,
                description,
                isProcessing: true
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

            logger.info("Creating post:");
            logger.info(post);
            logger.info(
                `${picTempPaths.length} pictures and ${vidTempPaths.length} videos`
            );

            await post.save();

            res.json(post.toObject());
            responseSent = true;

            const compressedImgPaths: string[] = [];
            const compressedVidPaths: string[] = [];

            for (const p of picTempPaths) {
                const originalStat = await stat(p);
                const originalSizeKb = originalStat.size / 1024;

                if (originalSizeKb > 1024 * 3) {
                    logger.debug(`Compressing picture ${p}`);
                    const minifiedPath = p + ".min.jpg";
                    await sharp(p).jpeg({ quality: 80 }).toFile(minifiedPath);

                    const newStat = await stat(minifiedPath);
                    const newSizeKb = newStat.size / 1024;

                    logger.info(
                        `Minified picture for post ${post._id} saved to ${minifiedPath} (${originalSizeKb}Kb -> ${newSizeKb}Kb)`
                    );
                    await unlink(p);

                    compressedImgPaths.push(minifiedPath);
                } else {
                    logger.info(`Picture ${p} is small enough, not minifying`);
                    compressedImgPaths.push(p);
                }
            }

            for (const v of vidTempPaths) {
                logger.debug(`Compressing video ${v}`);
                const compressedPath = v + ".compressed.mp4";
                const compressor = new VideoCompressor(v, compressedPath);
                await compressor.compress();

                const originalStat = await stat(v);
                const originalSizeMb = originalStat.size / 1024 / 1024;

                const newStat = await stat(compressedPath);
                const newSizeMb = newStat.size / 1024 / 1024;

                logger.info(
                    `Compressed video for post ${post._id} saved to ${compressedPath} (${originalSizeMb}Mb -> ${newSizeMb}Mb)`
                );
                await unlink(v);

                compressedVidPaths.push(compressedPath);
            }

            const compressedImgUrls: string[] = [];
            const compressedVidUrls: string[] = [];

            for (const f of [...compressedImgPaths, ...compressedVidPaths]) {
                const isImage = f.endsWith(".jpg");

                const mimeType = isImage ? "image/jpeg" : "video/mp4";
                const awsPath = await s3.uploadFile({
                    fileName: s3.generateFileName({
                        userId: user._id.toString(),
                        mimeType
                    }),
                    filePath: f,
                    mimeType,
                    folder: isImage ? "pics" : "vids"
                });

                if (isImage) {
                    compressedImgUrls.push(awsPath);
                } else {
                    compressedVidUrls.push(awsPath);
                }

                logger.info(
                    `Minified file for post ${post._id} uploaded to ${awsPath}`
                );
            }

            post.isProcessing = false;
            post.pictures.push(...compressedImgUrls);
            post.videos.push(...compressedVidUrls);
            logger.info("Post after processing:");
            logger.info(post);
            await post.save();
        } catch (err) {
            logger.error("Error while creating post");
            logger.error(err);
            if (!responseSent) {
                res.status(INTERNAL_SERVER_ERROR).json(createError());
            }
        }
    }
);

export default router;
