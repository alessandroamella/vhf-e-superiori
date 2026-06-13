import { Router } from "express";
import { param } from "express-validator";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "http-status";
import { logger } from "../../../shared/logger";
import { createError, validate } from "../../helpers";
import { BeaconCache } from "../cache";
import { Beacon, BeaconLeanWithProp, BeaconProperties } from "../models";

const router = Router();

/**
 * @openapi
 * /api/beacon/{id}:
 *  get:
 *    summary: Gets all Beacons
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *          format: ObjectId
 *        required: true
 *        description: ObjectId of the beacon to get
 *    tags:
 *      - beacon
 *    responses:
 *      '200':
 *        description: Beacon
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Beacon'
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
router.get("/:id", param("id").isMongoId(), validate, async (req, res) => {
  try {
    // Try to get from cache first
    const cachedBeacon = BeaconCache.getBeacon(req.params.id);
    if (cachedBeacon) {
      logger.debug(`Returning cached beacon ${req.params.id}`);
      return res.json(cachedBeacon);
    }

    // lean so we can add properties to the object. `owner` is a plain callsign
    // string (not a ref), so there is nothing to populate.
    const _beacon = await Beacon.findOne({ _id: req.params.id }).lean();
    if (!_beacon) {
      return res.status(BAD_REQUEST).json(createError());
    }

    // Sorted oldest-first; the last one holds the current properties.
    const props = await BeaconProperties.find({
      forBeacon: _beacon._id,
    })
      .populate({
        path: "editAuthor",
        select: "callsign isDev isAdmin",
      })
      .sort({ editDate: 1 })
      .lean();
    if (props.length === 0) {
      logger.error(`Beacon ${_beacon._id} has no properties`);
      logger.error(_beacon);
      return res.status(INTERNAL_SERVER_ERROR).json(createError());
    }
    const beacon = _beacon as unknown as BeaconLeanWithProp;
    // biome-ignore lint/suspicious/noExplicitAny: dont want to type
    (beacon as any).properties = props[props.length - 1];

    // Cache the result
    BeaconCache.setBeacon(req.params.id, beacon);

    res.json(beacon);
  } catch (err) {
    logger.error("Error in Beacons all");
    logger.error(err);
    return res.status(INTERNAL_SERVER_ERROR).json(createError());
  }
});

export default router;
