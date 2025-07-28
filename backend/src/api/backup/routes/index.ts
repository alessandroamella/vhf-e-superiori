import { Router } from "express";
import { INTERNAL_SERVER_ERROR } from "http-status";
import { logger } from "../../../shared/logger";
import { createError, validate } from "../../helpers";
import isAdmin from "../../middlewares/isAdmin";
import isLoggedIn from "../../middlewares/isLoggedIn";
import { backup } from "..";

const router = Router();

/**
 * @openapi
 * /api/backup:
 *  get:
 *    summary: Create a full backup
 *    tags:
 *      - backup
 *    responses:
 *      '200':
 *        description: Zipped backup
 *      '401':
 *        description: Not an admin
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
router.get("/", isLoggedIn, isAdmin, validate, async (req, res) => {
  try {
    const _backup = await backup.createBackup();
    if (!_backup) {
      logger.debug("Error in backup get (no backup)");
      return res.status(INTERNAL_SERVER_ERROR).json(createError());
    }

    return res.sendFile(_backup.zipPath);
  } catch (err) {
    logger.error("Error in backup get");
    logger.error(err);
    return res.status(INTERNAL_SERVER_ERROR).json(createError());
  }
});

export default router;
