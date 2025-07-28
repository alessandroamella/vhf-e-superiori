import { Request, Response, Router } from "express";
import { checkSchema } from "express-validator";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, OK } from "http-status";
import moment from "moment";
import { logger } from "../../../shared";
import { User, UserDoc } from "../../auth/models";
import EmailService from "../../email";
import { Errors } from "../../errors";
import EventModel from "../../event/models";
import { createError, validate } from "../../helpers";
import JoinRequest from "../models";
import createSchema from "../schemas/createSchema";

const router = Router();

/**
 * @openapi
 * /api/joinrequest:
 *  post:
 *    summary: Creates a new join request
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/JoinRequest'
 *    tags:
 *      - joinrequest
 *    responses:
 *      '200':
 *        description: Join request created successfully
 *      '400':
 *        description: Data validation failed
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ResErr'
 *      '401':
 *        description: Not logged in or outside the deadline
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
    if (!req.user) {
      throw new Error("No req.user in join request create");
    }
    try {
      const user = await User.findOne({
        _id: req.user._id,
      });
      if (!user) {
        throw new Error("Can't find user in joinRequest create");
      }

      const { antenna, forEvent } = req.body;

      const event = await EventModel.findOne({ _id: forEvent });
      if (!event) {
        return res
          .status(BAD_REQUEST)
          .json(createError(Errors.EVENT_NOT_FOUND));
      } else if (moment().isAfter(moment(event.joinDeadline))) {
        return res
          .status(BAD_REQUEST)
          .json(createError(Errors.EVENT_JOIN_TIME_EXPIRED));
      } else if (moment().isBefore(moment(event.joinStart))) {
        return res
          .status(BAD_REQUEST)
          .json(createError(Errors.EVENT_JOIN_TIME_TOO_EARLY));
      } else if (!user.isVerified) {
        return res
          .status(BAD_REQUEST)
          .json(createError(Errors.USER_NOT_VERIFIED));
      }

      const alreadyJoined = await JoinRequest.exists({
        fromUser: req.user._id,
        forEvent: event._id,
      });
      if (alreadyJoined) {
        return res
          .status(BAD_REQUEST)
          .json(createError(Errors.EVENT_JOIN_ALREADY_REQUESTED));
      }

      const joinRequest = await JoinRequest.create({
        antenna,
        forEvent: event._id,
        fromUser: req.user._id,
        isApproved: false,
      });

      await EmailService.sendJoinRequestMail(joinRequest, event, user);
      await EmailService.sendAdminJoinRequestMail(joinRequest, event, user);

      return res.json(OK);
    } catch (err) {
      logger.error("Error while creating join request");
      logger.error(err);
      res.status(INTERNAL_SERVER_ERROR).json(createError());
    }
  },
);

export default router;
