import { Request, Response, Router } from "express";
import { checkSchema } from "express-validator";
import createSchema from "../schemas/createSchema";
import { createError, validate } from "../../helpers";
import { logger } from "../../../shared";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "http-status";
import { S3Client } from "../../aws";
import { Errors } from "../../errors";
import { S3 } from "aws-sdk";
import Post from "../models";
import User, { UserDoc } from "../../auth/models";

const router = Router();

const s3 = new S3Client();

/**
 * @openapi
 * /post:
 *  post:
 *    summary: Creates a new post
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *           type: object
 *           required:
 *             - description
 *             - band
 *             - brand
 *             - metersFromSea
 *             - boomLengthCm
 *             - numberOfElements
 *             - numberOfAntennas
 *             - cable
 *             - filesPath
 *           properties:
 *             description:
 *               type: string
 *               minLength: 1
 *               description: Description of the event
 *             band:
 *               type: string
 *               enum: [144, 432, 1200]
 *               description: Frequency band of the antenna
 *             brand:
 *               type: string
 *               minLength: 0
 *               maxLength: 30
 *               description: Brand of the antenna
 *             isSelfBuilt:
 *               type: boolean
 *               description: Whether this antenna was self built
 *             metersFromSea:
 *               type: number
 *               maximum: 10000
 *               description: Height from sea level (in meters)
 *             boomLengthCm:
 *               type: number
 *               minimum: 0
 *               maximum: 100000
 *               description: Length of the boom (in centimeters)
 *             numberOfElements:
 *               type: integer
 *               minimum: 1
 *               maximum: 300
 *               description: Number of elements of this antenna
 *             numberOfAntennas:
 *               type: integer
 *               minimum: 0
 *               maximum: 100
 *               description: Number of coupled antennas (0 if none)
 *             cable:
 *               type: string
 *               minLength: 0
 *               maxLength: 100
 *               description: Brand, type, length... of the cable used for this antenna
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
        // DEBUG TO IMPLEMENT!!
        if (!req.user) {
            throw new Error("No req.user in post create");
        }
        try {
            const user = User.findOne({
                _id: (req.user as unknown as UserDoc)._id
            });
            if (!user) {
                throw new Error("User not found in post create");
            }

            const {
                description,
                band,
                brand,
                metersFromSea,
                boomLengthCm,
                isSelfBuilt,
                numberOfElements,
                numberOfAntennas,
                cable,
                filesPath
            } = req.body;

            logger.debug("Checking files");

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
                        "Error while getting file meta for file " + _p
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

            logger.debug("Creating post with following params");
            logger.debug({
                description,
                band,
                brand,
                isSelfBuilt,
                metersFromSea,
                boomLengthCm,
                numberOfElements,
                numberOfAntennas,
                cable,
                pictures,
                videos
            });
            const post = new Post({
                fromUser: user._id,
                description,
                isSelfBuilt,
                band,
                brand,
                metersFromSea,
                boomLengthCm,
                numberOfElements,
                numberOfAntennas,
                cable,
                isApproved: user.isAdmin,
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

            user.posts.push(post._id);
            await user.save();
            await post.save();

            res.json(post.toObject());
        } catch (err) {
            logger.error("Error while creating post");
            logger.error(err);
            res.status(INTERNAL_SERVER_ERROR).json(createError());
        }
    }
);

export default router;
