import { Request, Response, Router } from "express";
import { checkSchema } from "express-validator";
import { INTERNAL_SERVER_ERROR } from "http-status";
import { logger } from "../../../shared";
import { createError, validate } from "../../helpers";
import EventModel from "../models";
import createSchema from "../schemas/createSchema";

const router = Router();

/**
 * @openapi
 * /api/event:
 *  post:
 *    summary: Creates a new event
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
 *        description: Event created successfully
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
router.post(
  "/",
  checkSchema(createSchema),
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
      logger.debug("Creating event with following params");
      logger.debug({
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
      });
      const event = await EventModel.create({
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
      });
      res.json(event.toObject());
    } catch (err) {
      logger.error("Error while creating event");
      logger.error(err);
      res.status(INTERNAL_SERVER_ERROR).json(createError());
    }
  },
);

export default router;
