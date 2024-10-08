import { Request, Response, Router } from "express";
import EventModel from "../models";
import { createError, validate } from "../../helpers";
import { logger } from "../../../shared";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "http-status";
import { param } from "express-validator";
import JoinRequest, { JoinRequestClass } from "../../joinRequest/models";
import { UserDoc } from "../../auth/models";
import { Errors } from "../../errors";
import { FilterQuery } from "mongoose";

const router = Router();

/**
 * @openapi
 * /api/event:
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
                .lean();
            if (!event) {
                return res
                    .status(BAD_REQUEST)
                    .json(createError(Errors.EVENT_NOT_FOUND));
            }
            const q: FilterQuery<JoinRequestClass> = {
                forEvent: event._id
            };
            if (!(req.user as unknown as UserDoc)?.isAdmin) {
                q.isApproved = true;
            }
            const joinRequests = await JoinRequest.find(q, {
                fromUser: 1,
                isApproved: 1
            })
                .populate({
                    path: "fromUser",
                    select: "callsign"
                })
                .lean();
            res.json({ ...event, joinRequests });
        } catch (err) {
            logger.error("Error while finding events");
            logger.error(err);
            res.status(INTERNAL_SERVER_ERROR).json(createError());
        }
    }
);

export default router;
