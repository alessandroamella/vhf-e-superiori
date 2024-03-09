import { Request, Response, Router } from "express";
import JoinRequest from "../models";
import { param } from "express-validator";
import { createError, validate } from "../../helpers";
import { logger } from "../../../shared";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, OK } from "http-status";
import EmailService from "../../../email";
import { EventDoc } from "../../event/models";
import User from "../../auth/models";
import { Errors } from "../../errors";

const router = Router();

/**
 * @openapi
 * /api/joinrequest/{id}:
 *  post:
 *    summary: Toggle a join request approval (must be admin)
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *          format: ObjectId
 *        required: true
 *        description: ObjectId of the join request to approve (reject)
 *    tags:
 *      - joinrequest
 *    responses:
 *      '200':
 *        description: Join request approved / rejected successfully
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
    "/:_id",
    param("_id").isMongoId(),
    validate,
    async (req: Request, res: Response) => {
        try {
            const j = await JoinRequest.findOneAndUpdate(
                { _id: req.params._id },
                [{ $set: { isApproved: { $not: "$isApproved" } } }]
            ).populate("forEvent");
            const user = await User.findOne({ _id: j?.fromUser });
            if (!user) {
                return res
                    .status(BAD_REQUEST)
                    .json(createError(Errors.USER_NOT_FOUND));
            }
            await EmailService.sendAcceptJoinRequestMail(
                j as any,
                (j as any).forEvent,
                user
            );
            return res.sendStatus(OK);
        } catch (err) {
            logger.error("Error while approving join request");
            logger.error(err);
            res.status(INTERNAL_SERVER_ERROR).json(createError());
        }
    }
);

export default router;
