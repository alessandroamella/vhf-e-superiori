import { Router } from "express";
import { param } from "express-validator";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "http-status";
import { qrz } from "..";
import { logger } from "../../../shared/logger";
import { Errors } from "../../errors";
import { createError, validate } from "../../helpers";

const router = Router();

/**
 * @openapi
 * /api/qrz/{callsign}:
 *  get:
 *    summary: Fetch QRZ info for a callsign
 *    parameters:
 *      - in: path
 *        name: callsign
 *        schema:
 *          type: string
 *        required: true
 *        description: Callsign to fetch
 *    tags:
 *      - qrz
 *    responses:
 *      '200':
 *        description: Fetched QRZ info
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/QrzInfo'
 *      '400':
 *        description: Callsign not found
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
router.get(
    "/:callsign",
    param("callsign")
        .isString()
        .isLength({ min: 1, max: 10 })
        .trim()
        // .isAlphanumeric()
        .toUpperCase(),
    validate,
    async (req, res) => {
        try {
            const info = await qrz.getInfo(
                (req.params as { callsign: string }).callsign
            );
            if (!info) {
                throw new Error(Errors.QRZ_OM_NOT_FOUND);
            }
            logger.debug("QRZ successful");
            logger.debug(info);
            res.json(info);
        } catch (err) {
            if (
                err instanceof Error &&
                err.message === Errors.QRZ_OM_NOT_FOUND
            ) {
                logger.debug("QRZ route callsign not found error");
                logger.debug(err);
                return res.status(BAD_REQUEST).json(createError(err.message));
            }
            logger.error("Error while fetching qrz");
            logger.error(err);
            res.status(INTERNAL_SERVER_ERROR).json(
                createError(Errors.UNKNOWN_ERROR)
            );
        }
    }
);

export default router;
