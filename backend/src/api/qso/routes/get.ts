import { Router } from "express";
import { param } from "express-validator";
import { INTERNAL_SERVER_ERROR } from "http-status";
import { logger } from "../../../shared/logger";
import { Errors } from "../../errors";
import { createError, validate } from "../../helpers";
import { location } from "../../location";
import { Qso } from "../models";

const router = Router();

/**
 * @openapi
 * /api/qso/{id}:
 *  get:
 *    summary: Get a QSO by ID
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *          format: ObjectId
 *        required: true
 *        description: ObjectId of the QSO to get
 *    tags:
 *      - qso
 *    responses:
 *      '200':
 *        description: QSO
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Qso'
 *      '400':
 *        description: QSO not found
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
router.get(
  "/:_id",
  param("_id").isMongoId().withMessage(Errors.INVALID_OBJECT_ID),
  validate,
  async (req, res) => {
    try {
      logger.debug("Getting QSO by _id " + req.params._id);
      const qso = await Qso.findById(req.params._id, {
        emailSentDate: 0,
        emailSent: 0,
        __v: 0,
        createdAt: 0,
        updatedAt: 0,
      })
        .populate({
          path: "fromStation",
          select: "callsign isDev isAdmin",
        })
        .populate({ path: "event", select: "name date" })
        .lean();

      let fromLocator, toLocator;
      if (qso?.fromStationLat && qso?.fromStationLon) {
        fromLocator = location.calculateQth(
          qso?.fromStationLat,
          qso?.fromStationLon,
        );
      }
      if (qso?.toStationLat && qso?.toStationLon) {
        toLocator = location.calculateQth(qso?.toStationLat, qso?.toStationLon);
      }
      res.json({ ...qso, fromLocator, toLocator });
    } catch (err) {
      logger.error("Error in QSO get");
      logger.error(err);
      return res.status(INTERNAL_SERVER_ERROR).json(createError());
    }
  },
);

export default router;
