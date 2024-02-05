import { Router } from "express";
import { logger } from "../../../shared/logger";
import { query } from "express-validator";
import { createError, validate } from "../../helpers";
import { Qso } from "../models";
import { INTERNAL_SERVER_ERROR } from "http-status";
import { FilterQuery } from "mongoose";
import { QsoClass } from "../models/Qso";

const router = Router();

/**
 * @openapi
 * /qso:
 *  get:
 *    summary: Gets all QSOs, ordered by QSO date (reverse order)
 *    parameters:
 *      - in: query
 *        name: limit
 *        schema:
 *          type: integer
 *        description: Number of QSOs to return (all QSOs if not specified)
 *        required: false
 *      - in: query
 *        name: offset
 *        schema:
 *          type: integer
 *        description: Number of QSOs to skip (0 if not specified)
 *        required: false
 *      - in: query
 *        name: event
 *        schema:
 *          type: string
 *          format: ObjectId
 *        description: Event ID to filter by
 *        required: false
 *      - in: query
 *        name: fromStation
 *        schema:
 *          type: string
 *          format: ObjectId
 *        description: User ID of the station that sent the QSO
 *        required: false
 *      - in: query
 *        name: callsign
 *        schema:
 *          type: string
 *        description: Callsign of the station that received the QSO
 *        required: false
 *    tags:
 *      - auth
 *    responses:
 *      '200':
 *        description: QSOs
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/Qso'
 *      '401':
 *        description: Not logged in or not an admin
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
    "/",
    query("limit").optional().isInt().toInt(),
    query("offset").optional().isInt().toInt(),
    query("event").optional().isMongoId(),
    query("fromStation").optional().isMongoId(),
    query("callsign").optional().isString(),
    validate,
    async (req, res) => {
        try {
            const limit = parseInt(req.query.limit as string) as number;
            const skip = parseInt(req.query.offset as string) as number;

            const query: FilterQuery<QsoClass> = {};
            if (req.query.event) query.event = req.query.event;
            if (req.query.fromStation)
                query.fromStation = req.query.fromStation;
            if (req.query.callsign) query.callsign = req.query.callsign;

            const qsoQuery = Qso.find(query);
            if (limit) qsoQuery.limit(limit);
            if (skip) qsoQuery.skip(skip);

            const qsos = await qsoQuery.sort({ qsoDate: -1 }).lean();
            res.json(qsos);
        } catch (err) {
            logger.error("Error in QSOs all");
            logger.error(err);
            return res.status(INTERNAL_SERVER_ERROR).json(createError());
        }
    }
);

export default router;