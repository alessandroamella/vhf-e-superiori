import { Router } from "express";
import { INTERNAL_SERVER_ERROR } from "http-status";
import { logger } from "../../../shared/logger";
import { createError, validate } from "../../helpers";
import { User } from "../models";

const router = Router();

/**
 * @openapi
 * /api/auth/admins:
 *  get:
 *    summary: Gets all admins users, ordered by callsign
 *    tags:
 *      - auth
 *    responses:
 *      '200':
 *        description: Name and callsign of admins
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/User'
 *      '500':
 *        description: Server error
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ResErr'
 */
router.get("/", validate, async (_req, res) => {
  try {
    const users = await User.find(
      { isAdmin: true },
      {
        name: 1,
        callsign: 1,
      },
    ).sort({ callsign: 1 });

    return res.json(users);
  } catch (err) {
    logger.error("Error in admins all");
    logger.error(err);
    return res.status(INTERNAL_SERVER_ERROR).json(createError());
  }
});

export default router;
