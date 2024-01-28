import { Request, Response, Router } from "express";
import EventModel from "../models";
import { createError, validate } from "../../helpers";
import { logger } from "../../../shared";
import { INTERNAL_SERVER_ERROR } from "http-status";
import { param } from "express-validator";

const router = Router();

/**
 * @openapi
 * /event:
 *  get:
 *    summary: Get an event, with the field joinRequests.callsign populated
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
            const event = await EventModel.findOne({ _id: req.params._id })
                .sort({ date: 1 })
                .populate({
                    path: "joinRequests",
                    select: "fromUser isApproved",
                    populate: {
                        path: "fromUser",
                        select: "callsign"
                    }
                })
                .lean();
            res.json(event);
        } catch (err) {
            logger.error("Error while finding events");
            logger.error(err);
            res.status(INTERNAL_SERVER_ERROR).json(createError());
        }
    }
);

export default router;
