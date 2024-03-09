import { Request, Response, Router } from "express";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, NO_CONTENT } from "http-status";
import sharp from "sharp";
import { logger } from "../../../shared";
import fileUpload from "express-fileupload";
import { Errors } from "../../errors";
import { createError } from "../../helpers";
import { UserDoc } from "../../auth/models";
import { s3Client } from "../../aws";
import { unlink } from "fs/promises";
import path from "path";
import { query } from "express-validator";

const router = Router();

/**
 * @openapi
 * /api/event/upload:
 *  post:
 *    summary: Upload event picture to S3
 *    parameters:
 *      - in: query
 *        name: quality
 *        schema:
 *          type: integer
 *          minimum: 1
 *          maximum: 100
 *        description: Quality of the picture (defaults to 69)
 *        required: false
 *      - in: query
 *        name: isEqsl
 *        schema:
 *          type: boolean
 *        description: Whether the picture is an EQSL picture or not
 *        required: false
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
 *        description: File uploaded successfully
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              description: Path of the uploaded file
 *              properties:
 *                path:
 *                  type: string
 *              required:
 *                - path
 *      '400':
 *        description: File MIME type not allowed
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ResErr'
 *      '401':
 *        description: Not an admin
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
    query("quality").isInt({ min: 1, max: 100 }).optional(),
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

        if (fileArr.length === 0) {
            logger.debug("Tried to upload 0 files to event");
            return res.status(BAD_REQUEST).json(createError(Errors.NO_CONTENT));
        } else if (fileArr.length > 1) {
            logger.debug(
                "Tried to upload " + fileArr.length + " files to event"
            );
            return res
                .status(BAD_REQUEST)
                .json(createError(Errors.TOO_MANY_FILES));
        }

        logger.info("Uploading event picture");
        logger.info(JSON.stringify(fileArr));

        const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

        const f = fileArr[0];

        logger.debug(`Checking file ${f.name} MIME type`);
        if (!allowedMimeTypes.includes(f.mimetype)) {
            logger.debug("File MIME type not allowed for file " + f.name);
            await unlink(f.tempFilePath);
            return res
                .status(BAD_REQUEST)
                .json(createError(Errors.INVALID_FILE_MIME_TYPE));
        } else if (f.size > 10 * 1024 * 1024) {
            logger.debug("File size too big for file " + f.name);
            await unlink(f.tempFilePath);
            return res
                .status(BAD_REQUEST)
                .json(createError(Errors.FILE_SIZE_TOO_LARGE));
        }

        // Minify images here
        const quality = parseInt(req.query.quality as string) || 69;

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

            await sharp(minifiedImg).jpeg({ quality }).toFile(f.tempFilePath);
        } catch (err) {
            logger.error("Error minifying image");
            logger.error(err);
            await unlink(f.tempFilePath);
            return res.status(INTERNAL_SERVER_ERROR).json(createError());
        }

        let awsPath: string;
        logger.info("Uploading event pic file to S3 named " + f.name);
        try {
            awsPath = await s3Client.uploadFile({
                fileName: s3Client.generateFileName({
                    userId: (req.user as unknown as UserDoc)._id.toString(),
                    mimeType: f.mimetype
                }),
                filePath: f.tempFilePath,
                mimeType: f.mimetype,
                folder: req.query.isEqsl ? "eqsl" : "posters"
            });
            if (!awsPath) throw new Error("No awsPath in event picture upload");
            logger.info("Event picture file uploaded: " + f.name);
        } catch (err) {
            logger.error("Error uploading event picture file: " + f.name);
            logger.error(err);
            await unlink(f.tempFilePath);
            return res.status(INTERNAL_SERVER_ERROR).json(createError());
        }

        logger.info("Uploaded event picture file: " + awsPath);
        return res.json({ path: awsPath });
    }
);

export default router;
