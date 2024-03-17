import { Router } from "express";
import { logger } from "../../../shared/logger";
import { createError, validate } from "../../helpers";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, OK } from "http-status";
import { Beacon, BeaconProperties } from "../models";
import { param } from "express-validator";

const router = Router();

/**
 * @openapi
 * /api/beacon/{id}:
 *  delete:
 *    summary: Deletes a beacon
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
router.delete("/:id", param("id").isMongoId(), validate, async (req, res) => {
    try {
        const _beacon = await Beacon.findOne({ _id: req.params.id });
        if (!_beacon) {
            return res.status(BAD_REQUEST).json(createError());
        }

        await BeaconProperties.deleteMany({
            forBeacon: _beacon._id
        });
        await _beacon.deleteOne();

        res.sendStatus(OK);
    } catch (err) {
        logger.error("Error in Beacons all");
        logger.error(err);
        return res.status(INTERNAL_SERVER_ERROR).json(createError());
    }
});

export default router;
