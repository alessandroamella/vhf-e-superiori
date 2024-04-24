import { Router } from "express";
import { param, query } from "express-validator";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "http-status";
import { qrz } from "..";
import { logger } from "../../../shared/logger";
import { Errors } from "../../errors";
import { createError, validate } from "../../helpers";
import { location } from "../../location";
import { QrzMappedData } from "../interfaces/qrz";

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
 *      - in: query
 *        name: geocode
 *        schema:
 *          type: boolean
 *        description: Whether to fetch geocode info from Google Maps
 *        required: false
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
    query("geocode").optional().isBoolean().toBoolean(),
    validate,
    async (req, res) => {
        try {
            const info:
                | (QrzMappedData & {
                      city?: string;
                      province?: string;
                  })
                | null = await qrz.getInfo(
                (req.params as { callsign: string }).callsign
            );
            if (!info) {
                throw new Error(Errors.QRZ_OM_NOT_FOUND);
            }
            logger.debug("QRZ successful");
            logger.debug(info);

            if (req.query.geocode && info.lat && info.lon) {
                logger.debug("Fetching geocode info");
                const geocode = await location.reverseGeocode(
                    info.lat,
                    info.lon
                );
                if (geocode) {
                    const parsed = location.parseData(geocode);
                    info.address = parsed.formatted;
                    info.city = parsed.city;
                    info.province = parsed.province;
                }
            }

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
