import { Request, Response, Router } from "express";
import EventModel from "../models";
import { createError } from "../../helpers";
import { logger } from "../../../shared";
import { INTERNAL_SERVER_ERROR } from "http-status";

const router = Router();

/**
 * @openapi
 * /event:
 *  get:
 *    summary: Gets all existing events
 *    tags:
 *      - event
 *    responses:
 *      '200':
 *        description: Events
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/Event'
 *      '500':
 *        description: Server error
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ResErr'
 */
router.get("/", async (req: Request, res: Response) => {
    try {
        const events = await EventModel.find(
            {},
            { joinRequests: 0, __v: 0, createdAt: 0, updatedAt: 0 }
        ).sort({ date: 1 });
        res.json(events);
    } catch (err) {
        logger.error("Error while finding events");
        logger.error(err);
        res.status(INTERNAL_SERVER_ERROR).json(createError());
    }
});

export default router;
