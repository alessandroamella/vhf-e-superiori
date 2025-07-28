import { Router } from "express";
import { param } from "express-validator";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, OK } from "http-status";
import { logger } from "../../../shared/logger";
import { createError, validate } from "../../helpers";
import { Beacon, BeaconProperties } from "../models";

const router = Router();

/**
 * @openapi
 * /api/beacon/{id}:
 *  delete:
 *    summary: Deletes a beacon and all its properties
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *          format: ObjectId
 *        required: true
 *        description: ObjectId of the beacon to delete
 *    tags:
 *      - beacon
 *    responses:
 *      '200':
 *        description: Deleted successfully
 *      '401':
 *        description: Not an admin
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
router.delete("/:_id", param("_id").isMongoId(), validate, async (req, res) => {
  try {
    const _beacon = await Beacon.findOne({ _id: req.params._id });
    if (!_beacon) {
      return res.status(BAD_REQUEST).json(createError());
    }

    await BeaconProperties.deleteMany({
      forBeacon: _beacon._id,
    });
    await _beacon.deleteOne();

    res.sendStatus(OK);
  } catch (err) {
    logger.error("Error in Beacons all");
    logger.error(err);
    return res.status(INTERNAL_SERVER_ERROR).json(createError());
  }
});

/**
 * @openapi
 * /api/beacon/property/{id}:
 *  delete:
 *    summary: Deletes only the properties of a beacon
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *          format: ObjectId
 *        required: true
 *        description: ObjectId of the properties to delete
 *    tags:
 *      - beacon
 *    responses:
 *      '200':
 *        description: Deleted successfully
 *      '401':
 *        description: Not an admin
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
  "/property/:_id",
  param("_id").isMongoId(),
  validate,
  async (req, res) => {
    try {
      const props = await BeaconProperties.findOne({
        _id: req.params._id,
      });
      if (!props) {
        return res.status(BAD_REQUEST).json(createError());
      }

      await props.deleteOne();
      res.sendStatus(OK);
    } catch (err) {
      logger.error("Error in Beacons all");
      logger.error(err);
      return res.status(INTERNAL_SERVER_ERROR).json(createError());
    }
  },
);

export default router;
