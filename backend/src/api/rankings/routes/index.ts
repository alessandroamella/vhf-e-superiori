import { Router } from "express";
import { param } from "express-validator";
import { createError, validate } from "../../helpers";
import Event from "../../event/models";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "http-status";
import { Errors } from "../../errors";
import { Ranking } from "../../event/interfaces";
import { logger } from "../../../shared";
import { Qso, QsoDoc } from "../../qso/models";

const router = Router();

/**
 * @openapi
 * /api/rankings/{id}:
 *  get:
 *    summary: Gets all QSOs, ordered by QSO date (reverse order)
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *          format: ObjectId
 *        required: true
 *        description: ObjectId of the event
 *    tags:
 *      - rankings
 *    responses:
 *      '200':
 *        description: Rankings of the event
 *        content:
 *          application/json:
 *            type: array
 *            items:
 *              type: object
 *              properties:
 *                event:
 *                  $ref: '#/components/schemas/Event'
 *                rankings:
 *                  type: array
 *                  items:
 *                    $ref: '#/components/schemas/Ranking'
 *              required:
 *                - event
 *                - rankings
 *      '500':
 *        description: Server error
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ResErr'
 */
router.get(
    "/:_id",
    param("_id").isMongoId().withMessage(Errors.INVALID_OBJECT_ID),
    validate,
    async (req, res) => {
        logger.debug("Getting rankings for event: " + req.params._id);

        let event;
        try {
            event = await Event.findOne(
                { _id: req.params._id },
                {
                    name: 1,
                    description: 1,
                    band: 1,
                    date: 1,
                    logoUrl: 1,
                    imageHref: 1
                }
            );
        } catch (err) {
            logger.error("Error getting event for rankings");
            logger.error(err);
            return res.status(INTERNAL_SERVER_ERROR).json(createError());
        }

        if (!event) {
            return res
                .status(BAD_REQUEST)
                .json(createError(Errors.EVENT_NOT_FOUND));
        }

        // Get rankings
        const qsos = await Qso.find({ event: event._id }).populate({
            path: "fromStation",
            select: "callsign"
        });

        const map = new Map<string, QsoDoc[]>();
        for (const qso of qsos) {
            if (!map.has(qso.callsign)) {
                map.set(qso.callsign, []);
            }
            map.get(qso.callsign)?.push(qso);
        }

        const rankings: Ranking[] = [];
        for (const [callsign, qsos] of map) {
            rankings.push({ callsign, qsos });
        }

        rankings.sort((a, b) => b.qsos.length - a.qsos.length);

        logger.debug(`Event ${event._id} has ${rankings.length} rankings`);

        res.json({ event, rankings });
    }
);

export default router;
