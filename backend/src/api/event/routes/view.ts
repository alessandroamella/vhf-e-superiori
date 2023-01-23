import { Request, Response, Router } from "express";
import EventModel from "../models";
import { createError, validate } from "../../helpers";
import { logger } from "../../../shared";
import { INTERNAL_SERVER_ERROR } from "http-status";
import { param } from "express-validator";

const router = Router();

/**
 * @openapi
 * /event/{id}:
 *  get:
 *    summary: Gets an existing event
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *          format: ObjectId
 *        required: true
 *        description: ObjectId of the event to fetch
 *    tags:
 *      - event
 *    responses:
 *      '200':
 *        description: Event
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Event'
 *      '500':
 *        description: Server error
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ResErr'
 */
router.get(
    "/:_id",
    param("_id").isMongoId(),
    validate,
    async (req: Request, res: Response) => {
        try {
            const event = await EventModel.findOne(
                { _id: req.params._id },
                { joinRequests: 0, __v: 0, createdAt: 0, updatedAt: 0 }
            );
            res.json(event?.toObject());
        } catch (err) {
            logger.error("Error while finding event");
            logger.error(err);
            res.status(INTERNAL_SERVER_ERROR).json(createError());
        }
    }
);

export default router;
