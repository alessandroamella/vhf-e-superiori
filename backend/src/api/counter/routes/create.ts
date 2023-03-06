import { Router } from "express";
import { body } from "express-validator";
import { INTERNAL_SERVER_ERROR } from "http-status";
import { logger } from "../../../shared/logger";
import { UserDoc } from "../../auth/models";
import { createError, validate } from "../../helpers";
import CounterView from "../models";

const router = Router();

/**
 * @openapi
 * /counter:
 *  post:
 *    summary: New view to save in counter and returns views counter
 *    tags:
 *      - counter
 *    responses:
 *      '200':
 *        description: View added
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                views:
 *                  type: integer
 *                  description: Views counter
 *                date:
 *                  type: string
 *                  format: date-time
 *                  description: Date of the views counter
 *      '500':
 *        description: Server error
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ResErr'
 */
router.post("/", body("ip").isIP().optional(), validate, async (req, res) => {
    try {
        const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
        await CounterView.create({
            fromUser: (req.user as unknown as UserDoc)?._id,
            ip: req.body.ip || ip,
            date: new Date()
        });

        logger.debug("New view req.body.ip = " + req.body.ip + ", ip = " + ip);

        const views = await CounterView.estimatedDocumentCount();
        logger.debug("Total views: " + views);
        res.json({
            views,
            date: new Date()
        });
    } catch (err) {
        logger.error("Error in counter view create");
        logger.error(err);
        return res.status(INTERNAL_SERVER_ERROR).json(createError());
    }
});

export default router;
