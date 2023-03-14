import { Request, Response, Router } from "express";
import { logger } from "../../../shared";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, NO_CONTENT } from "http-status";
import { S3Client } from "../../aws";
import fileUpload from "express-fileupload";
import { Errors } from "../../errors";
import { createError } from "../../helpers";
import { UserDoc } from "../../auth/models";

const router = Router();

const s3 = new S3Client();

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
            logger.debug("No files to upload");
            return res.sendStatus(NO_CONTENT);
        }

        logger.debug("Uploading files");

        const _file = req.files.content;
        const fileArr: fileUpload.UploadedFile[] = Array.isArray(_file)
            ? _file
            : [_file];

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
                return res
                    .status(BAD_REQUEST)
                    .json(createError(Errors.INVALID_FILE_MIME_TYPE));
            } else if (f.size > 50 * 1024 * 1024) {
                logger.debug("File size too big for file " + f.name);
                return res
                    .status(BAD_REQUEST)
                    .json(createError(Errors.FILE_SIZE_TOO_LARGE));
            }
        }

        // DEBUG COMPRESS FILES!!
        logger.warn("Compress files not implemented");

        logger.debug("Uploading files to S3");
        for (const f of fileArr) {
            logger.debug("Uploading file: " + f.name);
            try {
                const path = await s3.uploadFile({
                    fileName: s3.generateFileName({
                        userId: (req.user as unknown as UserDoc)._id,
                        mimeType: f.mimetype
                    }),
                    fileContent: f.data
                });
                pathsArr.push(path);
                logger.debug("File uploaded: " + f.name);
            } catch (err) {
                logger.error("Error uploading file: " + f.name);
                logger.error(err);
                for (const uploadFile of pathsArr) {
                    logger.debug("Deleting file: " + uploadFile);
                    await s3.deleteFile({ filePath: uploadFile });
                    logger.debug("Deleted file: " + uploadFile);
                }
                return res.status(INTERNAL_SERVER_ERROR).json(createError());
            }
        }

        return res.json(pathsArr);
    }
);

export default router;
