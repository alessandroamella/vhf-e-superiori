import { Request, Response, Router } from "express";
import { checkSchema, param } from "express-validator";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, OK } from "http-status";
import { logger } from "../../../shared";
import { User } from "../../auth/models";
import { Errors } from "../../errors";
import { createError, validate } from "../../helpers";
import { BeaconProperties } from "../models";
import updateSchema from "../schemas/updateSchema";

const router = Router();

/**
 * @openapi
 * /api/beacon/approve/{id}:
 *  put:
 *    summary: Approves beacon edit
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *          format: ObjectId
 *        required: true
 *        description: ObjectId of the beacon edit to approve
 *    tags:
 *      - beacon
 *    responses:
 *      '200':
 *        description: Beacon edit approved
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

    const props = await BeaconProperties.findOne({
      _id: req.params._id,
    });
    if (!props) {
      res.status(BAD_REQUEST).json(createError(Errors.BEACON_NOT_FOUND));
      return;
    }

    try {
      props.verifiedBy = user._id;
      props.verifyDate = new Date();
      await props.save();

      res.sendStatus(OK);
    } catch (err) {
      logger.error("Error while approving beacon props");
      logger.error(err);
      res.status(INTERNAL_SERVER_ERROR).json(createError());
    }
  },
);

export default router;
