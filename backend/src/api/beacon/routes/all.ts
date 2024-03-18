import { Router } from "express";
import { logger } from "../../../shared/logger";
import { createError, validate } from "../../helpers";
import { INTERNAL_SERVER_ERROR } from "http-status";
import { Beacon, BeaconDocWithProp, BeaconProperties } from "../models";
import moment from "moment";

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
        const beacons: BeaconDocWithProp[] = await Beacon.find().lean();
        for (const beacon of beacons) {
            const propsArr = await BeaconProperties.find({
                forBeacon: beacon._id
            })
                .limit(1)
                .sort({ editDate: -1 });
            const props = propsArr[0];
            if (!props) {
                logger.error(`Beacon ${beacon._id} has no properties`);
                logger.error(beacon);
                return res.status(INTERNAL_SERVER_ERROR).json(createError());
            }
            beacon.properties = props;
        }
        beacons.sort((a, b) => {
            return moment(b.properties.editDate).diff(
                moment(a.properties.editDate)
            );
        });
        res.json(beacons);
    } catch (err) {
        logger.error("Error in Beacons all");
        logger.error(err);
        return res.status(INTERNAL_SERVER_ERROR).json(createError());
    }
});

export default router;
