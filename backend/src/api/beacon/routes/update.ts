import { Request, Response, Router } from "express";
import { checkSchema, param } from "express-validator";
import {
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  OK,
  UNAUTHORIZED,
} from "http-status";
import { logger } from "../../../shared";
import { User } from "../../auth/models";
import { Errors } from "../../errors";
import { createError, validate } from "../../helpers";
import { BeaconCache } from "../cache";
import { Beacon, BeaconProperties } from "../models";
import { canEditBeacon, resolveBeaconOwnerId } from "../permissions";
import updateSchema from "../schemas/updateSchema";

const router = Router();

/**
 * @openapi
 * /api/beacon/{id}:
 *  put:
 *    summary: Updates an existing beacon
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *          format: ObjectId
 *        required: true
 *        description: ObjectId of the beacon to update
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Beacon'
 *    tags:
 *      - beacon
 *    responses:
 *      '200':
 *        description: Beacon edit added
 *      '400':
 *        description: Data validation failed
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ResErr'
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
router.put(
  "/:_id",
  param("_id").isMongoId(),
  checkSchema(updateSchema),
  validate,
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error("No req.user in beacon props update");
    }

    const user = await User.findOne({
      _id: req.user._id,
    });
    if (!user) {
      throw new Error("User not found in beacon props update");
    }

    const beacon = await Beacon.findOne({
      _id: req.params._id,
    });
    if (!beacon) {
      res.status(BAD_REQUEST).json(createError(Errors.BEACON_NOT_FOUND));
      return;
    }

    const ownerId = await resolveBeaconOwnerId(beacon);
    if (!canEditBeacon(ownerId, user)) {
      res.status(UNAUTHORIZED).json(createError(Errors.BEACON_NOT_OWNER));
      return;
    }

    try {
      const {
        name,
        frequency,
        qthStr,
        locator,
        hamsl,
        antenna,
        mode,
        qtf,
        power,
        lat,
        lon,
      } = req.body;

      // Beacons now have a single set of properties (no edit history). Keep the
      // original properties document (preserving editAuthor/editDate of whoever
      // created the beacon) and update its fields in place; drop any leftover
      // legacy history documents so there is exactly one per beacon.
      const beaconProps =
        (await BeaconProperties.findOne({ forBeacon: beacon._id }).sort({
          editDate: 1,
        })) ??
        new BeaconProperties({
          forBeacon: beacon._id,
          editAuthor: user._id,
          editDate: new Date(),
        });

      await BeaconProperties.deleteMany({
        forBeacon: beacon._id,
        _id: { $ne: beaconProps._id },
      });

      beaconProps.set({
        name,
        frequency,
        qthStr,
        locator,
        hamsl,
        antenna,
        mode,
        qtf,
        power,
        lat,
        lon,
      });

      try {
        await beaconProps.validate();
      } catch (err) {
        logger.debug("Error while validating beacon props in update");
        logger.debug(err);
        return res.status(BAD_REQUEST).json(createError(Errors.INVALID_BEACON));
      }

      await beaconProps.save();

      // Invalidate cache since beacon properties changed
      BeaconCache.invalidateBeacon(req.params._id);

      res.sendStatus(OK);
    } catch (err) {
      logger.error("Error while updating beacon props");
      logger.error(err);
      res.status(INTERNAL_SERVER_ERROR).json(createError());
    }
  },
);

export default router;
