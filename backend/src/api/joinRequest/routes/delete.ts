import { Request, Response, Router } from "express";
import EventModel from "../../event/models";
import JoinRequest from "../models";
import { createError, validate } from "../../helpers";
import { logger } from "../../../shared";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, OK } from "http-status";
import { param } from "express-validator";
import { Errors } from "../../errors";
import moment from "moment";
import User, { UserDoc } from "../../auth/models";

const router = Router();

/**
 * @openapi
 * /joinrequest/{id}:
 *  delete:
 *    summary: Deletes an existing join request
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *          format: ObjectId
 *        required: true
 *        description: ObjectId of the join request to delete
 *    tags:
 *      - joinrequest
 *    responses:
 *      '200':
 *        description: Join request deleted successfully
 *      '400':
 *        description: Join request not found, not owned or over deadline
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
router.delete(
    "/:_id",
    param("_id").isMongoId(),
    validate,
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new Error("No req.user in join request delete");
        }
        try {
            const user = await User.findOne({
                _id: (req.user as unknown as UserDoc)._id
            });
            if (!user) {
                throw new Error("Can't find user in join request delete");
            }

            const obj: { _id: string; fromUser?: string } = {
                _id: req.params._id
            };
            if (!user.isAdmin) {
                obj.fromUser = user._id.toString();
            }

            const joinRequest = await JoinRequest.findOne(obj);
            if (!joinRequest) {
                return res
                    .status(BAD_REQUEST)
                    .json(createError(Errors.JOIN_REQUEST_NOT_FOUND));
            }

            const event = await EventModel.findOne({
                _id: joinRequest.forEvent
            });
            if (!event) {
                logger.error(
                    "Join request " +
                        joinRequest._id +
                        " pointing to non-existing event" +
                        joinRequest.forEvent
                );
                return res.status(INTERNAL_SERVER_ERROR).json(createError());
            } else if (moment().isAfter(moment(event.joinDeadline))) {
                return res
                    .status(BAD_REQUEST)
                    .json(createError(Errors.EVENT_JOIN_TIME_EXPIRED));
            }

            await event.updateOne({ $pull: { joinRequests: joinRequest._id } });

            await user.updateOne({
                $pull: { joinRequests: joinRequest._id }
            });

            await JoinRequest.deleteOne({ _id: req.params._id });
            res.sendStatus(OK);
        } catch (err) {
            logger.error("Error while deleting join request");
            logger.error(err);
            res.status(INTERNAL_SERVER_ERROR).json(createError());
        }
    }
);

export default router;
