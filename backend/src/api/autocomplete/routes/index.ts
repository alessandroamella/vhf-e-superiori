import { Router } from "express";
import { param } from "express-validator";
import { createError, validate } from "../../helpers";
import User from "../../auth/models";
import { qrz } from "../../qrz";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "http-status";
import { logger } from "../../../shared";
import { Errors } from "../../errors";
import moment, { Moment } from "moment";

const router = Router();

/**
 * @openapi
 * /api/autocomplete/{callsign}:
 *  get:
 *    summary: Find user by callsign for autocomplete in QSO form
 *    parameters:
 *      - in: path
 *        name: callsign
 *        schema:
 *          type: string
 *        required: true
 *        description: Callsign to search for
 *    tags:
 *      - autocomplete
 *    responses:
 *      '200':
 *        description: A user object
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - callsign
 *              properties:
 *                callsign:
 *                  type: string
 *                address:
 *                  type: string
 *                name:
 *                  type: string
 *                email:
 *                  type: string
 *                pictureUrl:
 *                  type: string
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

interface UserAutocomplete {
    callsign: string;
    name?: string;
    address?: string;
    email?: string;
    pictureUrl?: string;
}

const cache: { [callsign: string]: UserAutocomplete & { date: Moment } } = {};

router.get(
    "/:callsign",
    param("callsign").isString().trim().toUpperCase(),
    validate,
    async (req, res) => {
        const { callsign } = req.params;

        if (cache[callsign]) {
            if (moment().diff(cache[callsign].date, "days") < 1) {
                return res.json(cache[callsign]);
            } else {
                delete cache[callsign];
            }
        }

        try {
            const user = await User.findOne({
                callsign
            });
            if (user) {
                const { name, email, address } = user;
                const response: UserAutocomplete = {
                    callsign,
                    name,
                    email,
                    address
                };
                cache[callsign] = { ...response, date: moment() };
                return res.json(response);
            }

            const scraped = await qrz.scrapeAllData(callsign);
            if (scraped) {
                const { name, email, url, address } = scraped;
                const response: UserAutocomplete = {
                    callsign,
                    name,
                    email,
                    pictureUrl: url,
                    address
                };
                cache[callsign] = { ...response, date: moment() };
                return res.json(response);
            }

            return res
                .status(BAD_REQUEST)
                .json(createError(Errors.USER_NOT_FOUND));
        } catch (err) {
            logger.error("Error in autocomplete");
            logger.error(err);

            res.status(INTERNAL_SERVER_ERROR).json(createError());
        }
    }
);

export default router;
