import { Router } from "express";
import { INTERNAL_SERVER_ERROR } from "http-status";
import { logger } from "../../../shared/logger";
import { createError } from "../../helpers";
import CounterView from "../models";

const router = Router();

/**
 * @openapi
 * /api/counter:
 *  get:
 *    summary: Get number of views
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
router.get("/", async (req, res) => {
  try {
    const views = await CounterView.estimatedDocumentCount();
    logger.debug("Total views: " + views);
    res.json({
      views,
      date: new Date(),
    });
  } catch (err) {
    logger.error("Error in counter view get");
    logger.error(err);
    return res.status(INTERNAL_SERVER_ERROR).json(createError());
  }
});

export default router;
