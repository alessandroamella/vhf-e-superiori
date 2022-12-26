import { Request, Response, Router } from "express";
import EventModel from "../models";
import { checkSchema } from "express-validator";
import { createError, validate } from "../../helpers";
import isAdmin from "../../middlewares/isAdmin";
import { logger } from "../../../shared";
import { INTERNAL_SERVER_ERROR } from "http-status";
import { param } from "express-validator";
import updateSchema from "../schemas/updateSchema";

const router = Router();

/**
 * @openapi
 * /event/{id}:
 *  put:
 *    summary: Updates an existing event
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *          format: ObjectId
 *        required: true
 *        description: ObjectId of the event to update
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
 *              date:
 *                type: string
 *                format: date-time
 *                description: Date of the event
 *              joinDeadline:
 *                type: string
 *                format: date-time
 *                description: Deadline to join the event
 *    tags:
 *      - event
 *    responses:
 *      '200':
 *        description: Event updated successfully
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
router.put(
    "/:_id",
    isAdmin,
    param("_id").isMongoId(),
    checkSchema(updateSchema),
    validate,
    async (req: Request, res: Response) => {
        try {
            const { name, date, joinDeadline } = req.body;
            const event = await EventModel.findOneAndUpdate(
                { _id: req.params._id },
                { name, date, joinDeadline },
                { new: true }
            );
            res.json(event);
        } catch (err) {
            logger.error("Error while updating event");
            logger.error(err);
            res.status(INTERNAL_SERVER_ERROR).json(createError());
        }
    }
);

export default router;
