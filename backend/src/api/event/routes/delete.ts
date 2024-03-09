import { Request, Response, Router } from "express";
import EventModel from "../models";
import { createError, validate } from "../../helpers";
import { logger } from "../../../shared";
import { INTERNAL_SERVER_ERROR, OK } from "http-status";
import { param } from "express-validator";

const router = Router();

/**
 * @openapi
 * /api/event/{id}:
 *  delete:
 *    summary: Deletes an existing event
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *          format: ObjectId
 *        required: true
 *        description: ObjectId of the event to delete
 *    tags:
 *      - event
 *    responses:
 *      '200':
 *        description: Event deleted successfully
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
router.delete(
    "/:_id",
    param("_id").isMongoId(),
    validate,
    async (req: Request, res: Response) => {
        try {
            await EventModel.deleteOne({ _id: req.params._id });
            res.sendStatus(OK);
        } catch (err) {
            logger.error("Error while deleting event");
            logger.error(err);
            res.status(INTERNAL_SERVER_ERROR).json(createError());
        }
    }
);

export default router;
