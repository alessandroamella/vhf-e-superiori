import { Request, Response, Router } from "express";
import { checkSchema, param } from "express-validator";
import { INTERNAL_SERVER_ERROR } from "http-status";
import { logger } from "../../../shared";
import { createError, validate } from "../../helpers";
import EventModel from "../models";
import updateSchema from "../schemas/updateSchema";

const router = Router();

/**
 * @openapi
 * /api/event/{id}:
 *  put:
 *    summary: Updates an existing event
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *          format: ObjectId
 *        required: true
 *        description: ObjectId of the event to update
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Event'
 *    tags:
 *      - event
 *    responses:
 *      '200':
 *        description: Event updated successfully
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Event'
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
    try {
      const {
        name,
        band,
        description,
        date,
        logoUrl,
        eqslUrl,
        joinStart,
        joinDeadline,
        offsetCallsign,
        offsetData,
        offsetFrom,
      } = req.body;
      const event = await EventModel.findOneAndUpdate(
        { _id: req.params._id },
        {
          name,
          band,
          description,
          date,
          logoUrl,
          eqslUrl,
          joinStart,
          joinDeadline,
          offsetCallsign,
          offsetData,
          offsetFrom,
        },
        { new: true },
      );
      res.json(event?.toObject());
    } catch (err) {
      logger.error("Error while updating event");
      logger.error(err);
      res.status(INTERNAL_SERVER_ERROR).json(createError());
    }
  },
);

export default router;
