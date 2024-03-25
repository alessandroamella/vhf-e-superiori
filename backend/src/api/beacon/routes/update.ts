import { Request, Response, Router } from "express";
import { Beacon, BeaconProperties } from "../models";
import { checkSchema } from "express-validator";
import { createError, validate } from "../../helpers";
import { logger } from "../../../shared";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, OK } from "http-status";
import { param } from "express-validator";
import updateSchema from "../schemas/updateSchema";
import { Errors } from "../../errors";
import { User, UserDoc } from "../../auth/models";

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
            _id: (req.user as unknown as UserDoc)._id
        });
        if (!user) {
            throw new Error("User not found in beacon props update");
        }

        const beacon = await Beacon.findOne({
            _id: req.params._id
        });
        if (!beacon) {
            res.status(BAD_REQUEST).json(createError(Errors.BEACON_NOT_FOUND));
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
                lon
            } = req.body;

            const beaconProps = new BeaconProperties({
                name,
                forBeacon: beacon._id,
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
                verifyDate: user.isAdmin ? new Date() : undefined
            });

            try {
                await beaconProps.validate();
            } catch (err) {
                logger.debug("Error while validating beacon props in update");
                logger.debug(err);
                return res
                    .status(BAD_REQUEST)
                    .json(createError(Errors.INVALID_BEACON));
            }

            await beaconProps.save();

            res.sendStatus(OK);
        } catch (err) {
            logger.error("Error while updating beacon props");
            logger.error(err);
            res.status(INTERNAL_SERVER_ERROR).json(createError());
        }
    }
);

export default router;
