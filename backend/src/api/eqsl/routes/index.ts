import { Request, Response, Router } from "express";
import { body } from "express-validator";
import { INTERNAL_SERVER_ERROR } from "http-status";
import { logger } from "../../../shared/logger";
import { Errors } from "../../errors";
import { createError, validate } from "../../helpers";
import EqslPic from "../eqsl";
import User, { UserDoc } from "../../auth/models";
import isLoggedIn from "../../middlewares/isLoggedIn";
import JoinRequest from "../../joinRequest/models";
import moment from "moment";
import { isDocument } from "@typegoose/typegoose";
import { Qso } from "../../qso/models";

const router = Router();

/**
 * @openapi
 * /api/eqsl:
 *  post:
 *    summary: (Forcibly) create a new eQSL image
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required:
 *              - qso
 *            properties:
 *              qso:
 *                type: string
 *                format: ObjectId
 *    tags:
 *      - eqsl
 *    responses:
 *      '200':
 *        description: Image of the created eQSL
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                href:
 *                  type: string
 *                  format: uri
 *      '401':
 *        description: Not authorized to create eQSL
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
    isLoggedIn,
    body("qso").isMongoId(),
    validate,
    async (req: Request, res: Response) => {
        try {
            if (!req.user) {
                throw new Error("No req.user in user change pw");
            }

            const user = await User.findOne({
                _id: (req.user as unknown as UserDoc)._id
            });
            if (!user) {
                throw new Error("User not found in eqsl create");
            }

            const qso = await Qso.findOne({ _id: req.body.qso });
            if (!qso) {
                return res.status(400).json(createError(Errors.QSO_NOT_FOUND));
            }

            // TODO refactor
            const joinRequest = await JoinRequest.findOne({
                fromUser: (req.user as unknown as UserDoc)._id,
                forEvent: qso.event,
                isApproved: true
            }).populate("forEvent");
            if (!joinRequest) {
                logger.debug("Join request not found");
                return res
                    .status(401)
                    .json(createError(Errors.NOT_AUTHORIZED_TO_EQSL));
            }
            if (!isDocument(joinRequest.forEvent)) {
                throw new Error("Join request forEvent not populated");
            }

            if (
                !user.isAdmin &&
                moment().subtract(1, "days").isAfter(joinRequest.forEvent.date)
            ) {
                logger.debug(
                    "User is not admin and event is over 1 day in the past"
                );
                return res
                    .status(401)
                    .json(createError(Errors.NOT_AUTHORIZED_TO_EQSL));
            }

            if (!joinRequest.forEvent.eqslUrl) {
                logger.debug("Event has no eQSL URL");
                return res
                    .status(400)
                    .json(createError(Errors.NO_IMAGE_TO_EQSL));
            }
            const eqslPic = new EqslPic(joinRequest.forEvent.eqslUrl);

            await eqslPic.fetchImage();
            await eqslPic.addQsoInfo(qso);
            const href = await eqslPic.uploadImage(
                (req.user as unknown as UserDoc)._id.toString(),
                true
            );

            res.status(200).json({ href });
        } catch (err) {
            logger.error("Error creating eQSL");
            logger.error(err);
            res.status(INTERNAL_SERVER_ERROR).json(
                createError(Errors.ERROR_CREATING_IMAGE)
            );
        }
    }
);

export default router;
