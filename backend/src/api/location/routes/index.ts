import { Router } from "express";
import { location } from "..";
import { param, query } from "express-validator";
import { createError, validate } from "../../helpers";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "http-status";
import { Errors } from "../../errors";
import { logger } from "../../../shared";

const router = Router();

/**
 * @openapi
 * /api/location/locator/{lat}/{lon}:
 *  get:
 *    summary: Get QTH from lat/lon
 *    parameters:
 *      - in: path
 *        name: lat
 *        schema:
 *          type: number
 *        required: true
 *        description: Latitude
 *      - in: path
 *        name: lon
 *        schema:
 *          type: number
 *        required: true
 *        description: Longitude
 *    tags:
 *      - location
 *    responses:
 *      '200':
 *        description: QSO
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                locator:
 *                  type: string
 *                  description: Ham radio locator
 *              required:
 *                - locator
 *      '400':
 *        description: Invalid lat/lon
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ResErr'
 *      '500':
 *        description: Server error in parsing
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ResErr'
 */

router.get(
    "/locator/:lat/:lon",
    param("lat").isNumeric(),
    param("lon").isNumeric(),
    validate,
    async (req, res) => {
        const lat = parseFloat(req.params.lat);
        const lon = parseFloat(req.params.lon);

        try {
            const qth = location.calculateQth(lat, lon);

            if (!qth) {
                throw new EvalError("Invalid lat/lon");
            }

            res.json({ locator: qth });
        } catch (err) {
            if (err instanceof EvalError) {
                logger.debug("Error while parsing lat/lon");
                logger.debug(err);
                res.status(BAD_REQUEST).json(
                    createError(Errors.ERROR_QTH_PARSE)
                );
            } else {
                logger.error("Error while parsing lat/lon");
                logger.error(err);
                res.status(INTERNAL_SERVER_ERROR).json(
                    createError(Errors.ERROR_QTH_PARSE)
                );
            }
        }
    }
);

/**
 * @openapi
 * /api/location/latlon/{qth}:
 *  get:
 *    summary: Get lat/lon from QTH
 *    parameters:
 *      - in: path
 *        name: qth
 *        schema:
 *          type: string
 *        required: true
 *        description: Ham radio locator
 *      - in: query
 *        name: geocode
 *        schema:
 *          type: boolean
 *        required: false
 *        description: Whether to reverse geocode the lat/lon
 *    tags:
 *      - location
 *    responses:
 *      '200':
 *        description: QSO
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                locator:
 *                  type: string
 *                  description: Ham radio locator
 *                address:
 *                  type: string
 *                  description: Reverse geocoded address
 *                city:
 *                  type: string
 *                  description: Reverse geocoded city
 *                province:
 *                  type: string
 *                  description: Reverse geocoded province
 *                lat:
 *                  type: number
 *                  description: Reverse geocoded latitude
 *                lon:
 *                  type: number
 *                  description: Reverse geocoded longitude
 *              required:
 *                - lat
 *                - lon
 *                - locator
 *      '400':
 *        description: Invalid QTH
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ResErr'
 *      '500':
 *        description: Server error in parsing
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ResErr'
 */

router.get(
    "/latlon/:qth",
    param("qth").isString(),
    query("geocode").isBoolean().optional().toBoolean(),
    validate,
    async (req, res) => {
        const qth = req.params.qth as string;

        try {
            const latLon = location.calculateLatLon(qth);

            if (!latLon) {
                throw new EvalError("Invalid QTH");
            }

            const locator = location.calculateQth(latLon[0], latLon[1]);

            if (!locator) {
                logger.warn(
                    "Invalid calculated lat/lon while calculating locator"
                );
                throw new EvalError("Invalid QTH");
            }

            const address: {
                city?: string;
                province?: string;
                formatted?: string;
            } = {};
            if (req.query.geocode) {
                const geocoded = await location.reverseGeocode(
                    latLon[0],
                    latLon[1]
                );
                if (!geocoded) {
                    logger.warn(
                        "Error while reverse geocoding lat " +
                            latLon[0] +
                            " lon " +
                            latLon[1]
                    );
                    throw new EvalError("Error while reverse geocoding");
                }

                logger.debug("Reverse geocoded address:");
                logger.debug(geocoded);
                address.city =
                    geocoded.address_components.find(
                        e =>
                            e.types.includes("administrative_area_level_3") ||
                            e.types.includes("locality")
                    )?.long_name || geocoded.address_components[0]?.long_name;
                address.province =
                    geocoded.address_components.find(
                        e =>
                            e.types.includes("administrative_area_level_2") ||
                            e.types.includes("administrative_area_level_1")
                    )?.short_name ||
                    geocoded.address_components[1]?.short_name ||
                    geocoded.address_components[0]?.short_name;

                const country =
                    geocoded.address_components.find(e =>
                        e.types.includes("country")
                    )?.long_name ||
                    geocoded.address_components[2]?.long_name ||
                    geocoded.address_components[1]?.long_name;

                address.formatted =
                    address.city && address.province && country
                        ? `${address.city}, ${address.province}, ${country}`
                        : geocoded.formatted_address;
            }

            res.json({
                lat: latLon[0],
                lon: latLon[1],
                locator,
                address: address.formatted,
                city: address.city,
                province: address.province
            });
        } catch (err) {
            if (err instanceof EvalError) {
                logger.debug("Error while parsing QTH");
                logger.debug(err);
                res.status(BAD_REQUEST).json(
                    createError(Errors.ERROR_QTH_PARSE)
                );
            } else {
                logger.error("Error while parsing QTH");
                logger.error(err);
                res.status(INTERNAL_SERVER_ERROR).json(
                    createError(Errors.ERROR_QTH_PARSE)
                );
            }
        }
    }
);

export default router;
