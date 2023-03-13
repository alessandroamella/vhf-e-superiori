import { Request, Response, Router } from "express";
import { checkSchema } from "express-validator";
import createSchema from "../schemas/createSchema";
import { createError, validate } from "../../helpers";
import { logger } from "../../../shared";
import { INTERNAL_SERVER_ERROR } from "http-status";

const router = Router();

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
 *            $ref: '#/components/schemas/Post'
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
        try {
            const {
                name,
                band,
                description,
                date,
                logoUrl,
                joinStart,
                joinDeadline
            } = req.body;
            logger.debug("Creating event with following params");
            logger.debug({
                name,
                band,
                description,
                date,
                logoUrl,
                joinStart,
                joinDeadline
            });
            const event = await EventModel.create({
                name,
                band,
                description,
                date,
                logoUrl,
                joinStart,
                joinDeadline
            });
            res.json(event.toObject());
        } catch (err) {
            logger.error("Error while creating event");
            logger.error(err);
            res.status(INTERNAL_SERVER_ERROR).json(createError());
        }
    }
);

export default router;
