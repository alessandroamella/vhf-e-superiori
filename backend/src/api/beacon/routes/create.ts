import { Request, Response, Router } from "express";
import { checkSchema } from "express-validator";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "http-status";
import { logger } from "../../../shared";
import { User, UserDoc } from "../../auth/models";
import { Errors } from "../../errors";
import { createError, validate } from "../../helpers";
import { Beacon, BeaconProperties } from "../models";
import createSchema from "../schemas/createSchema";

const router = Router();

/**
 * @openapi
 * /api/beacon:
 *  post:
 *    summary: Creates a new beacon
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
 *        description: Beacon created
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Beacon'
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
      throw new Error("No req.user in beacon create");
    }
    try {
      const user = await User.findOne({
        _id: req.user._id,
      });
      if (!user) {
        throw new Error("User not found in beacon create");
      }

      const {
        name,
        callsign,
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

      const existing = await Beacon.findOne({ callsign });
      if (existing) {
        return res.status(BAD_REQUEST).json(createError(Errors.BEACON_EXISTS));
      }

      const beaconProps = new BeaconProperties({
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
        editAuthor: user._id,
        editDate: new Date(),
        verifiedBy: user.isAdmin ? user._id : undefined,
        verifyDate: user.isAdmin ? new Date() : undefined,
      });

      const beacon = new Beacon({
        callsign,
        properties: beaconProps._id,
      });

      beaconProps.forBeacon = beacon._id;

      try {
        await beaconProps.validate();
        await beacon.validate();
      } catch (err) {
        logger.debug("Error while validating beacon");
        logger.debug(err);
        return res.status(BAD_REQUEST).json(createError(Errors.INVALID_BEACON));
      }

      await beaconProps.save();
      await beacon.save();

      // TODO invia mail di conferma

      res.json(beacon.toObject());
    } catch (err) {
      logger.error("Error while creating beacon");
      logger.error(err);
      res.status(INTERNAL_SERVER_ERROR).json(createError());
    }
  },
);

export default router;
