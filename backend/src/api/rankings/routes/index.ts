import { Router } from "express";
import { param } from "express-validator";
import { createError, validate } from "../../helpers";
import Event, { EventDoc } from "../../event/models";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "http-status";
import { Errors } from "../../errors";
import { Ranking } from "../../event/interfaces";
import { logger } from "../../../shared";
import { Qso, QsoDoc } from "../../qso/models";
import { isDocument } from "@typegoose/typegoose";
import JoinRequest from "../../joinRequest/models";
import { UserDoc } from "../../auth/models";

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

        let event: EventDoc;
        try {
            const _event = await Event.findOne(
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
            if (!_event) {
                return res
                    .status(BAD_REQUEST)
                    .json(createError(Errors.EVENT_NOT_FOUND));
            }
            event = _event;
        } catch (err) {
            logger.error("Error getting event for rankings");
            logger.error(err);
            return res.status(INTERNAL_SERVER_ERROR).json(createError());
        }

        // Get rankings
        const qsos = await Qso.find(
            { event: event._id },
            {
                emailSent: 0,
                event: 0,
                updatedAt: 0,
                __v: 0
            }
        ).populate({
            path: "fromStation",
            select: "callsign"
        });

        const stations = await JoinRequest.find({
            forEvent: event._id,
            isApproved: true
        }).populate({
            path: "fromUser",
            select: "callsign"
        });
        const stationCallsigns = [
            ...new Set([
                ...(stations
                    .map(e => {
                        if (!isDocument(e.fromUser)) {
                            logger.error(
                                `JoinRequest.fromUser ${e.fromUser} is not a document for JoinRequest ${e._id} in event ${event._id}`
                            );
                            return null;
                        }
                        return (e.fromUser as unknown as UserDoc).callsign;
                    })
                    .filter(e => e !== null) as string[]),
                ...qsos.map(e => e.fromStationCallsignOverride)
            ])
        ];

        const map = new Map<string, { qsos: QsoDoc[]; isStation: boolean }>();
        for (const qso of qsos) {
            if (!map.has(qso.callsign)) {
                map.set(qso.callsign, {
                    qsos: [],
                    isStation: stationCallsigns.includes(qso.callsign)
                });
            }
            map.get(qso.callsign)?.qsos.push(qso);

            if (!isDocument(qso.fromStation)) {
                logger.error(
                    `QSO.fromStation ${qso.fromStation} is not a document for QSO ${qso._id} in event ${event._id}`
                );
                continue;
            }

            const fromCallsign =
                qso.fromStationCallsignOverride || qso.fromStation.callsign;

            if (!map.has(fromCallsign)) {
                map.set(fromCallsign, {
                    qsos: [],
                    isStation: stationCallsigns.includes(fromCallsign)
                });
            }
            map.get(fromCallsign)?.qsos.push(qso);
        }

        const _rankings: (Omit<Ranking, "position"> & {
            isStation: boolean;
        })[] = [];
        for (const [callsign, data] of map) {
            _rankings.push({
                callsign,
                qsos: data.qsos,
                isStation: data.isStation
            });
        }

        _rankings.sort((a, b) => b.qsos.length - a.qsos.length);

        logger.debug(`Event ${event._id} has ${_rankings.length} rankings`);

        const [stationRankings, userRankings] = [true, false].map(
            b =>
                _rankings
                    .filter(e => e.isStation === b)
                    .map((ranking, index) => ({
                        callsign: ranking.callsign,
                        qsos: ranking.qsos,
                        position: index + 1
                    })) as Ranking[]
        );

        res.json({ event, rankings: { stationRankings, userRankings } });
    }
);

export default router;
