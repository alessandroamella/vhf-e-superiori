import { Router } from "express";
import { INTERNAL_SERVER_ERROR } from "http-status";
import { logger } from "../../../shared/logger";
import { createError, validate } from "../../helpers";
import {
  Beacon,
  BeaconLean,
  BeaconLeanWithProp,
  BeaconProperties,
} from "../models";

const router = Router();

/**
 * @openapi
 * /api/beacon:
 *  get:
 *    summary: Gets all Beacons
 *    tags:
 *      - beacon
 *    responses:
 *      '200':
 *        description: Beacons
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/Beacon'
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
router.get("/", validate, async (req, res) => {
  try {
    const beacons: BeaconLean[] = await Beacon.find().sort("callsign").lean();
    const beaconsWithProps: BeaconLeanWithProp[] = [];

    for (const beacon of beacons) {
      const propsArr = await BeaconProperties.find(
        {
          forBeacon: beacon._id,
        },
        {
          verifiedBy: 0,
          verifyDate: 0,
          editAuthor: 0,
          editDate: 0,
        },
      )
        .populate({
          path: "editAuthor",
          select: "callsign isDev isAdmin",
        })
        .limit(1)
        .sort({ editDate: -1 });
      const props = propsArr[0];
      if (!props) {
        logger.error(`Beacon ${beacon._id} has no properties`);
        logger.error(beacon);
        return res.status(INTERNAL_SERVER_ERROR).json(createError());
      }
      const beaconWithProps: BeaconLeanWithProp = {
        ...beacon,
        properties: props,
      };
      beaconsWithProps.push(beaconWithProps);
    }
    // sort beacons by prop frequency, in ascending order
    beaconsWithProps.sort((a, b) => {
      if (!a.properties || !b.properties) {
        logger.warn(`Beacon ${a._id} or ${b._id} has no properties`);
        return 0;
      }
      return a.properties.frequency - b.properties.frequency;
    });

    res.json(beaconsWithProps);
  } catch (err) {
    logger.error("Error in Beacons all");
    logger.error(err);
    return res.status(INTERNAL_SERVER_ERROR).json(createError());
  }
});

export default router;
