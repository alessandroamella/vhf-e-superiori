import { Request, Response, Router } from "express";
import { checkSchema } from "express-validator";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "http-status";
import { logger } from "../../../shared";
import { createError, validate } from "../../helpers";
import { Errors } from "../../errors";
import createSchema from "../schemas/createSchema";
import { User, UserDoc } from "../../auth/models";
import { Qso } from "../models";
import JoinRequest from "../../joinRequest/models";
import { location } from "../../location";

const router = Router();

/**
 * @openapi
 * /api/qso:
 *  post:
 *    summary: Creates a new QSO
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Qso'
 *    tags:
 *      - qso
 *    responses:
 *      '200':
 *        description: Qso created successfully
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Qso'
 *      '400':
 *        description: Data validation failed
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
router.post(
    "/",
    checkSchema(createSchema),
    validate,
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new Error("No req.user in QSO create");
        }
        try {
            const user = await User.findOne({
                _id: (req.user as unknown as UserDoc)._id
            });
            if (!user) {
                throw new Error("User not found in QSO create");
            }

            let _fromStation: UserDoc = user;
            if (user.isAdmin && req.body.fromStation) {
                const fromStation = await User.findOne({
                    _id: req.body.fromStation
                });
                if (!fromStation) {
                    logger.debug(
                        `User ${req.body.fromStation} not found in QSO admin create`
                    );
                    return res
                        .status(BAD_REQUEST)
                        .json(createError(Errors.USER_NOT_FOUND));
                }
                _fromStation = fromStation;
            } else {
                // find join request with same event and user to check for permissions
                const joinRequest = await JoinRequest.findOne({
                    forEvent: req.body.event,
                    fromUser: user._id
                });
                if (!joinRequest) {
                    logger.debug(
                        `Join request not found for event ${
                            req.body.event
                        } and user ${user._id.toString()}`
                    );
                    return res
                        .status(BAD_REQUEST)
                        .json(createError(Errors.JOIN_REQUEST_NOT_FOUND));
                } else if (!joinRequest.isApproved) {
                    logger.debug(
                        `Join request not approved for event ${
                            req.body.event
                        } and user ${user._id.toString()}`
                    );
                    return res
                        .status(BAD_REQUEST)
                        .json(createError(Errors.JOIN_REQUEST_NOT_APPROVED));
                }
            }

            const {
                callsign,
                event,
                frequency,
                band,
                mode,
                qsoDate,
                locator,
                rst,
                notes,
                fromStationCity,
                fromStationProvince,
                fromStationLat,
                fromStationLon
            } = req.body;

            const fromStation = _fromStation._id.toString();

            logger.info("Creating QSO with following params");
            logger.info({
                fromStation,
                callsign,
                event,
                frequency,
                band,
                mode,
                qsoDate,
                fromStationCity,
                fromStationProvince,
                fromStationLat,
                fromStationLon,
                locator,
                rst,
                notes
            });
            const qso = new Qso({
                fromStation,
                callsign,
                event,
                frequency,
                band,
                mode,
                qsoDate,
                fromStationCity,
                fromStationProvince,
                fromStationLat,
                fromStationLon,
                locator,
                rst,
                notes
            });
            try {
                await qso.validate();
            } catch (err) {
                logger.warn("Error while validating QSO");
                logger.warn(err);
                return res
                    .status(BAD_REQUEST)
                    .json(createError(Errors.INVALID_QSO));
            }

            await qso.save();

            const populated = await qso.populate({
                path: "fromStation",
                select: "callsign"
            });

            res.json({
                ...populated.toObject(),
                toLocator:
                    populated.toStationLat && populated.toStationLon
                        ? location.calculateQth(
                              populated.toStationLat,
                              populated.toStationLon
                          )
                        : undefined
            });
        } catch (err) {
            logger.error("Error while creating QSO");
            logger.error(err);
            res.status(INTERNAL_SERVER_ERROR).json(createError());
        }
    }
);

export default router;
