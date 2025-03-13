import { isDocument } from "@typegoose/typegoose";
import { Router } from "express";
import { param } from "express-validator";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "http-status";
import { logger } from "../../../shared";
import type { UserDoc } from "../../auth/models";
import { Errors } from "../../errors";
import Event, { EventDoc } from "../../event/models";
import { createError, validate } from "../../helpers";
import JoinRequest from "../../joinRequest/models";
import { Qso, QsoDoc } from "../../qso/models";
import { Ranking } from "../schemas";

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

        // const stationUsers = await User.find({
        //     _id: {
        //         $in: qsos.map(e => e.fromStation)
        //     }
        // });

        const stationCallsigns = new Set<string>(
            stations
                .filter((e) => isDocument(e.fromUser))
                .map((e) => (e.fromUser as unknown as UserDoc).callsign)
            // ...stationUsers.map(e => e.callsign)
        );

        // also add eventually overriden callsigns
        for (const { fromStationCallsignOverride } of qsos.filter(
            (e) =>
                isDocument(e.fromStation) &&
                e.fromStationCallsignOverride &&
                stationCallsigns.has(e.fromStation.callsign)
        )) {
            stationCallsigns.add(fromStationCallsignOverride!);
        }

        const map = new Map<string, { qsos: QsoDoc[]; isStation: boolean }>();
        for (const qso of qsos) {
            if (!map.has(qso.callsign)) {
                map.set(qso.callsign, {
                    qsos: [],
                    isStation: stationCallsigns.has(qso.callsign)
                });
            }
            map.get(qso.callsign)!.qsos.push(qso);

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
                    isStation: stationCallsigns.has(fromCallsign)
                });
            }
            map.get(fromCallsign)!.qsos.push(qso);
        }

        const _rankings: (Omit<Ranking, "position"> & {
            isStation: boolean;
        })[] = [];
        for (const [callsign, data] of map) {
            _rankings.push({
                callsign,
                qsos: data.qsos,
                isStation: data.isStation,
                // 2 points if QSO to a station, 1 point if not
                points: data.qsos.reduce(
                    (acc, qso) =>
                        acc +
                        // if by station or to station is event station, 2 points
                        ([qso.callsign, callsign].some((e) =>
                            stationCallsigns.has(e)
                        )
                            ? 2
                            : 1),
                    0
                )
            });
        }

        _rankings.sort((a, b) => b.points - a.points);

        logger.debug(`Event ${event._id} has ${_rankings.length} rankings`);

        const [stationRankings, userRankings] = [true, false].map((b) =>
            _rankings
                .filter((e) => e.isStation === b)
                .map((ranking, index) => {
                    const { isStation, ...rest } = ranking;
                    logger.debug(
                        `Ranking for ${isStation ? "station" : "hunter"} ${
                            ranking.callsign
                        } has ${ranking.qsos.length} QSOs and ${
                            ranking.points
                        } points`
                    );
                    return {
                        ...rest,
                        position: index + 1
                    };
                })
        );

        res.json({ event, rankings: { stationRankings, userRankings } });
    }
);

export default router;
