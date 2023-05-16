import { Request, Response, Router } from "express";
import { logger } from "../../../shared";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, NO_CONTENT } from "http-status";
import fileUpload from "express-fileupload";
import { Errors } from "../../errors";
import { createError } from "../../helpers";
import { UserDoc } from "../../auth/models";
import { s3Client } from "../../aws";
import { compressVideos } from "../../videoCompressor/compressorInterface";
import path, { basename } from "path";
import { unlink } from "fs/promises";
import sharp from "sharp";

const router = Router();

interface UploadStatus {
    // md5: string;
    percent: number;
}
const currentUploads = new Map<string, UploadStatus>();
const removeFromUploads = (files: fileUpload.UploadedFile[]) => {
    files.forEach(f => currentUploads.delete(f.md5));
};
export const setCompressPercentage = (md5: string, percent: number) => {
    currentUploads.set(md5, { percent });
};
export const getUploadStatus = (md5: string): UploadStatus | undefined => {
    return currentUploads.get(md5);
};

/**
 * @openapi
 * /post/upload:
 *  post:
 *    summary: Upload files
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              content:
 *                type: string
 *                format: binary
 *                description: Pictures or videos of the post
 *            required:
 *              - content
 *    tags:
 *      - post
 *    responses:
 *      '200':
 *        description: Files uploaded successfully
 *      '204':
 *        description: No file specified
 *      '400':
 *        description: File MIME type not allowed
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ResErr'
 *      '401':
 *        description: Not logged in or not verified
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
    // body("pictures").isArray(),
    // validate,
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new Error("No req.user in post file upload");
        } else if (!req.files) {
            logger.info("No files to upload");
            return res.status(NO_CONTENT).json(createError(Errors.NO_CONTENT));
        }

        const _file = req.files.content;
        const fileArr: fileUpload.UploadedFile[] = Array.isArray(_file)
            ? _file
            : [_file];

        fileArr.forEach(f => {
            currentUploads.set(f.md5, {
                percent: 0
            });
        });

        logger.info("Uploading files");
        logger.info(JSON.stringify(fileArr, null, 2));

        const pathsArr: string[] = [];

        const allowedMimeTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "video/mp4",
            "video/quicktime",
            "video/x-msvideo",
            "video/x-ms-wmv"
        ];

        // Check files MIME type and size (max 50MB)
        logger.debug("Checking files MIME type and size");
        for (const f of fileArr) {
            logger.debug(`Checking file ${f.name} MIME type`);
            if (!allowedMimeTypes.includes(f.mimetype)) {
                logger.debug("File MIME type not allowed for file " + f.name);
                removeFromUploads(fileArr);
                for (const _f of fileArr) {
                    await unlink(_f.tempFilePath);
                }
                return res
                    .status(BAD_REQUEST)
                    .json(createError(Errors.INVALID_FILE_MIME_TYPE));
            } else if (f.size > 300 * 1024 * 1024) {
                logger.debug("File size too big for file " + f.name);
                removeFromUploads(fileArr);
                for (const _f of fileArr) {
                    await unlink(_f.tempFilePath);
                }
                return res
                    .status(BAD_REQUEST)
                    .json(createError(Errors.FILE_SIZE_TOO_LARGE));
            }
        }

        // DEBUG COMPRESS FILES!!
        // logger.warn("Compress files not implemented");

        // Compress videos
        const vidsToCompress = fileArr.filter(f =>
            f.mimetype.includes("video")
        );
        const pics = fileArr.filter(f => !f.mimetype.includes("video"));

        if (pics.length > 5) {
            removeFromUploads(fileArr);
            for (const _f of fileArr) {
                await unlink(_f.tempFilePath);
            }
            return res
                .status(BAD_REQUEST)
                .json(createError(Errors.TOO_MANY_PICTURES));
        } else if (vidsToCompress.length > 2) {
            removeFromUploads(fileArr);
            for (const _f of fileArr) {
                await unlink(_f.tempFilePath);
            }
            return res
                .status(BAD_REQUEST)
                .json(createError(Errors.TOO_MANY_VIDEOS));
        }

        for (const f of pics) {
            // Minify images here
            try {
                const minifiedImg = await sharp(f.tempFilePath)
                    .toFormat("jpeg")
                    .toBuffer();

                // Delete old file, replace new path as jpeg
                await unlink(f.tempFilePath);
                f.tempFilePath = path.format({
                    dir: path.dirname(f.tempFilePath),
                    name: path.basename(
                        f.tempFilePath,
                        path.extname(f.tempFilePath)
                    ),
                    ext: ".jpeg"
                });
                f.mimetype = "image/jpeg";

                await sharp(minifiedImg)
                    .jpeg({ quality: 69 })
                    .toFile(f.tempFilePath);
            } catch (err) {
                logger.error("Error minifying image");
                logger.error(err);
                await unlink(f.tempFilePath);
                return res.status(INTERNAL_SERVER_ERROR).json(createError());
            }
        }

        pics.forEach(f => {
            currentUploads.set(f.md5, {
                percent: 100
            });
        });

        logger.info("Compressing videos:");
        logger.info(vidsToCompress.map(f => f.name).join(", "));

        let compressedVidsPaths: string[];
        try {
            compressedVidsPaths = await compressVideos(
                vidsToCompress.map(f => ({
                    tempFilePath: f.tempFilePath,
                    md5: f.md5
                }))
            );
        } catch (err) {
            logger.error("Error compressing videos");
            logger.error(err);
            removeFromUploads(fileArr);
            for (const _f of fileArr) {
                await unlink(_f.tempFilePath);
            }
            return res.status(INTERNAL_SERVER_ERROR).json(createError());
        }

        const filesToUpload: {
            name: string;
            tempFilePath: string;
            mimetype: string;
        }[] = [
            ...pics,
            ...compressedVidsPaths.map(p => ({
                name: basename(p),
                tempFilePath: p,
                mimetype: "video/mp4"
            }))
        ];

        logger.info("Uploading files to S3");
        for (const f of filesToUpload) {
            logger.info("Uploading file: " + f.name);
            try {
                const path = await s3Client.uploadFile({
                    fileName: s3Client.generateFileName({
                        userId: (req.user as unknown as UserDoc)._id,
                        mimeType: f.mimetype
                    }),
                    filePath: f.tempFilePath,
                    mimeType: f.mimetype,
                    folder: f.mimetype.includes("image") ? "pics" : "vids"
                });
                pathsArr.push(path);
                logger.info("File uploaded: " + f.name);
            } catch (err) {
                logger.error("Error uploading file: " + f.name);
                logger.error(err);
                for (const uploadFile of pathsArr) {
                    logger.info("Deleting file: " + uploadFile);
                    await s3Client.deleteFile({ filePath: uploadFile });
                    logger.info("Deleted file: " + uploadFile);
                }
                removeFromUploads(fileArr);
                for (const _f of fileArr) {
                    await unlink(_f.tempFilePath);
                }
                return res.status(INTERNAL_SERVER_ERROR).json(createError());
            }
        }

        logger.info("Uploaded files: " + pathsArr.join(", "));
        removeFromUploads(fileArr);
        // for (const _f of fileArr) {
        //     await unlink(_f.tempFilePath);
        // }
        return res.json(pathsArr);
    }
);

export default router;
