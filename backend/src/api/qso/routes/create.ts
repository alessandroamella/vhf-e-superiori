import { Request, Response, Router } from "express";
import { checkSchema } from "express-validator";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "http-status";
import { pick } from "lodash-es";
import { logger } from "../../../shared";
import { User, UserDoc } from "../../auth/models";
import { Errors } from "../../errors";
import { createError, validate } from "../../helpers";
import { location } from "../../location";
import { Qso } from "../models";
import createSchema from "../schemas/createSchema";

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
        _id: req.user._id,
      });
      if (!user) {
        throw new Error("User not found in QSO create");
      }

      let _fromStation: UserDoc = user;
      if (user.isAdmin && req.body.fromStation) {
        const fromStation = await User.findOne(
          {
            _id: req.body.fromStation,
          },
          {
            _id: true,
            callsign: true,
          },
        );
        if (!fromStation) {
          logger.debug(
            `User ${req.body.fromStation} not found in QSO admin create`,
          );
          return res
            .status(BAD_REQUEST)
            .json(createError(Errors.USER_NOT_FOUND));
        }
        _fromStation = fromStation;
      }

      const fromStation = _fromStation._id.toString();

      const qsoBody = {
        fromStation,
        ...pick(req.body, [
          "callsign",
          "fromStationCallsignOverride",
          "event",
          "frequency",
          "band",
          "mode",
          "qsoDate",
          "locator",
          "rst",
          "notes",
          "fromStationCity",
          "fromStationProvince",
          "fromStationLat",
          "fromStationLon",
        ]),
      };

      logger.info("Creating QSO with following params");
      logger.info(
        Object.entries(qsoBody)
          .map(
            ([k, v]) =>
              `${k}: ${k === "fromStation" ? `${v} (${_fromStation.callsign})` : v}`,
          )
          .join(", "),
      );
      const qso = new Qso(qsoBody);
      try {
        await qso.validate();
      } catch (err) {
        logger.warn("Error while validating QSO");
        logger.warn(err);
        return res.status(BAD_REQUEST).json(createError(Errors.INVALID_QSO));
      }

      await qso.save();

      const populated = await qso.populate({
        path: "fromStation",
        select: "callsign isDev isAdmin",
      });

      res.json({
        ...populated.toObject(),
        toLocator:
          populated.toStationLat && populated.toStationLon
            ? location.calculateQth(
                populated.toStationLat,
                populated.toStationLon,
              )
            : undefined,
      });
    } catch (err) {
      logger.error("Error while creating QSO");
      logger.error(err);
      res.status(INTERNAL_SERVER_ERROR).json(createError());
    }
  },
);

export default router;
