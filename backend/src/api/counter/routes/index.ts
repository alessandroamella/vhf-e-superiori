import { Router } from "express";
import { INTERNAL_SERVER_ERROR, OK } from "http-status";
import { logger } from "../../../shared/logger";
import { createError } from "../../helpers";
import CounterView from "../models";

const router = Router();

/**
 * @openapi
 * /auth/changepw:
 *  post:
 *    summary: New view to save in counter
 *    tags:
 *      - counter
 *    responses:
 *      '200':
 *        description: View added
 *      '500':
 *        description: Server error
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ResErr'
 */
router.get("/", async (req, res) => {
    try {
        const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
        await CounterView.create({ fromUser: req.user?._id, ip });

        logger.debug("New counter view from ip " + ip);
        res.sendStatus(OK);
    } catch (err) {
        logger.error("Error in counter view create");
        logger.error(err);
        return res.status(INTERNAL_SERVER_ERROR).json(createError());
    }
});

export default router;
