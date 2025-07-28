import { Request, Response, Router } from "express";
import { param } from "express-validator";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "http-status";
import { FilterQuery } from "mongoose";
import { logger } from "../../../shared";
import { Errors } from "../../errors";
import { createError, validate } from "../../helpers";
import JoinRequest, { JoinRequestClass } from "../../joinRequest/models";
import EventModel from "../models";

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
        forEvent: event._id,
      };
      if (!req.user?.isAdmin) {
        q.isApproved = true;
      }
      const joinRequests = await JoinRequest.find(q, {
        fromUser: 1,
        isApproved: 1,
      })
        .populate({
          path: "fromUser",
          select: "callsign isDev isAdmin",
        })
        .lean();
      res.json({ ...event, joinRequests });
    } catch (err) {
      logger.error("Error while finding events");
      logger.error(err);
      res.status(INTERNAL_SERVER_ERROR).json(createError());
    }
  },
);

export default router;
