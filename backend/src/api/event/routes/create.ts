import { Request, Response, Router } from "express";
import EventModel from "../models";
import { checkSchema } from "express-validator";
import createSchema from "../schemas/createSchema";
import { createError, validate } from "../../helpers";
import { logger } from "../../../shared";
import { INTERNAL_SERVER_ERROR } from "http-status";

const router = Router();

/**
 * @openapi
 * /event:
 *  post:
 *    summary: Creates a new event
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              name:
 *                type: string
 *                minLength: 1
 *                description: Name of the event
 *              description:
 *                type: string
 *                minLength: 1
 *                description: Description of the event
 *              band:
 *                type: string
 *                minLength: 1
 *                description: Radio band of the event
 *              date:
 *                type: string
 *                format: date-time
 *                description: Date of the event
 *              logoUrl:
 *                type: string
 *                format: uri
 *                description: URL of the logo of this event
 *              joinStart:
 *                type: string
 *                format: date-time
 *                description: Start date to join the event
 *              joinDeadline:
 *                type: string
 *                format: date-time
 *                description: Deadline to join the event
 *            required:
 *              - name
 *              - date
 *              - joinDeadline
 *    tags:
 *      - event
 *    responses:
 *      '200':
 *        description: Event created successfully
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Event'
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
