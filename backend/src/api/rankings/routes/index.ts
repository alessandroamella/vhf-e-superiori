import { isDocument } from "@typegoose/typegoose";
import { Router } from "express";
import { param } from "express-validator";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "http-status";
import moment, { Moment } from "moment";
import { logger } from "../../../shared";
import type { UserDoc } from "../../auth/models";
import { Errors } from "../../errors";
import Event, { EventDoc } from "../../event/models";
import { createError, validate } from "../../helpers";
import JoinRequest, { JoinRequestDoc } from "../../joinRequest/models";
import { Qso, QsoDoc } from "../../qso/models";
import { Ranking } from "../schemas";

const router = Router();

// In-memory cache for yearly rankings
const yearlyRankingsCache: {
  date: Moment | null;
  data: { stationRankings: Ranking[]; userRankings: Ranking[] } | null;
} = {
  date: null,
  data: null,
};
const CACHE_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes

type RankingExtended = Ranking & { isStation: boolean };

// Reusable ranking calculation function (used by both endpoints)
const calculateRankings = async (
  eventId: string | null,
  qsos: QsoDoc[],
  stations: JoinRequestDoc[],
): Promise<{
  stationRankings: RankingExtended[];
  userRankings: RankingExtended[];
}> => {
  const stationCallsigns = new Set<string>(
    stations
      .filter((e) => isDocument(e.fromUser))
      .map((e) => (e.fromUser as unknown as UserDoc).callsign),
  );

  // also add eventually overridden callsigns
  for (const { fromStationCallsignOverride } of qsos.filter(
    (e) =>
      isDocument(e.fromStation) &&
      e.fromStationCallsignOverride &&
      stationCallsigns.has(e.fromStation.callsign),
  )) {
    stationCallsigns.add(fromStationCallsignOverride!);
  }

  const map = new Map<string, { qsos: QsoDoc[]; isStation: boolean }>();
  for (const qso of qsos) {
    if (!map.has(qso.callsign)) {
      map.set(qso.callsign, {
        qsos: [],
        isStation: stationCallsigns.has(qso.callsign),
      });
    }
    map.get(qso.callsign)!.qsos.push(qso);

    if (!isDocument(qso.fromStation)) {
      logger.error(
        `QSO.fromStation ${qso.fromStation} is not a document for QSO ${
          qso._id
        } ${eventId ? `in event ${eventId}` : ""}`,
      );
      continue;
    }

    const fromCallsign =
      qso.fromStationCallsignOverride || qso.fromStation.callsign;

    if (!map.has(fromCallsign)) {
      map.set(fromCallsign, {
        qsos: [],
        isStation: stationCallsigns.has(fromCallsign),
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
          ([qso.callsign, callsign].some((e) => stationCallsigns.has(e))
            ? 2
            : 1),
        0,
      ),
    });
  }

  _rankings.sort((a, b) => b.points - a.points);

  const [stationRankings, userRankings] = [true, false].map((b) =>
    _rankings
      .filter((e) => e.isStation === b)
      .map((ranking, index) => {
        const { ...rest } = ranking; // Keep isStation here!
        logger.debug(
          `Ranking for ${rest.isStation ? "station" : "hunter"} ${
            ranking.callsign
          } has ${ranking.qsos.length} QSOs and ${
            ranking.points
          } points ${eventId ? `in event ${eventId}` : ""}`,
        );
        return {
          ...rest,
          position: index + 1,
        };
      }),
  );
  return { stationRankings, userRankings };
};

/**
 * @openapi
 * /api/rankings/{id}:
 *  get:
 *    summary: Gets rankings for a specific event
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
 *            type: object
 *            properties:
 *              event:
 *                  $ref: '#/components/schemas/Event'
 *              rankings:
 *                  type: object
 *                  properties:
 *                    stationRankings:
 *                      type: array
 *                      items:
 *                        $ref: '#/components/schemas/Ranking'
 *                    userRankings:
 *                      type: array
 *                      items:
 *                        $ref: '#/components/schemas/Ranking'
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
          imageHref: 1,
        },
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
        __v: 0,
      },
    ).populate({
      path: "fromStation",
      select: "callsign isDev isAdmin",
    });

    const stations = await JoinRequest.find({
      forEvent: event._id,
      isApproved: true,
    }).populate({
      path: "fromUser",
      select: "callsign isDev isAdmin",
    });

    const { stationRankings, userRankings } = await calculateRankings(
      event._id.toString(),
      qsos,
      stations,
    );

    res.json({ event, rankings: { stationRankings, userRankings } });
  },
);

/**
 * @openapi
 * /api/rankings:
 *  get:
 *    summary: Gets rankings for the current solar year, aggregated from each event
 *    tags:
 *      - rankings
 *    responses:
 *      '200':
 *        description: Rankings of the current solar year
 *        content:
 *          application/json:
 *            type: object
 *            properties:
 *              event:
 *                  type: 'null'
 *                  description: Event is null for yearly rankings
 *              rankings:
 *                  type: object
 *                  properties:
 *                    stationRankings:
 *                      type: array
 *                      items:
 *                        $ref: '#/components/schemas/Ranking'
 *                    userRankings:
 *                      type: array
 *                      items:
 *                        $ref: '#/components/schemas/Ranking'
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
router.get("/", async (req, res) => {
  logger.debug("Getting rankings for current solar year");

  const startOfYear = moment().startOf("year");
  const endOfYear = moment().endOf("year");

  // Check cache
  if (
    yearlyRankingsCache.data &&
    yearlyRankingsCache.date &&
    moment().diff(yearlyRankingsCache.date) < CACHE_EXPIRATION_MS
  ) {
    logger.debug("Returning yearly rankings from cache");
    return res.json({ event: null, rankings: yearlyRankingsCache.data });
  }
  logger.debug("Cache miss or expired, recalculating yearly rankings");

  // Get all events for the current solar year
  const events = await Event.find(
    {
      date: {
        $gte: startOfYear.toDate(),
        $lte: endOfYear.toDate(),
      },
    },
    { _id: 1 },
  ).sort({ date: 1 }); // Sort by date to process in chronological order

  if (!events || events.length === 0) {
    logger.debug("No events found for the current solar year.");
    yearlyRankingsCache.data = { stationRankings: [], userRankings: [] }; // Cache empty result
    yearlyRankingsCache.date = moment();
    return res.json({
      event: null,
      rankings: { stationRankings: [], userRankings: [] },
    });
  }

  const aggregatedRankingsMap = new Map<
    string,
    {
      callsign: string;
      qsos: QsoDoc[];
      points: number;
      isStation: boolean; // Keep track of if was station in *any* event
    }
  >();

  for (const event of events) {
    logger.debug(`Processing event ${event._id} for yearly rankings`);

    const qsos = await Qso.find(
      { event: event._id },
      {
        emailSent: 0,
        event: 0,
        updatedAt: 0,
        __v: 0,
      },
    ).populate({
      path: "fromStation",
      select: "callsign isDev isAdmin",
    });

    const stations = await JoinRequest.find({
      forEvent: event._id,
      isApproved: true,
    }).populate({
      path: "fromUser",
      select: "callsign isDev isAdmin",
    });

    const eventRankingsResult = await calculateRankings(
      event._id.toString(),
      qsos,
      stations,
    );
    const allEventRankings = [
      ...eventRankingsResult.stationRankings,
      ...eventRankingsResult.userRankings,
    ];

    for (const ranking of allEventRankings) {
      const {
        callsign,
        qsos: eventQSOs,
        points: eventPoints,
        isStation,
      } = ranking; // Now isStation is correctly destructured

      if (aggregatedRankingsMap.has(callsign)) {
        const existingRanking = aggregatedRankingsMap.get(callsign)!;
        aggregatedRankingsMap.set(callsign, {
          callsign,
          qsos: [...existingRanking.qsos, ...eventQSOs],
          points: existingRanking.points + eventPoints,
          isStation: existingRanking.isStation || isStation, // Use isStation directly from ranking
        });
      } else {
        aggregatedRankingsMap.set(callsign, {
          callsign,
          qsos: eventQSOs,
          points: eventPoints,
          isStation: isStation, // Use isStation directly from ranking
        });
      }
    }
  }

  const _aggregatedRankings: (Omit<Ranking, "position"> & {
    isStation: boolean;
  })[] = Array.from(aggregatedRankingsMap.values());
  _aggregatedRankings.sort((a, b) => b.points - a.points);

  const [stationRankings, userRankings] = [true, false].map((b) =>
    _aggregatedRankings
      .filter((e) => e.isStation === b)
      .map((ranking, index) => {
        const { ...rest } = ranking; // Keep isStation here for final response too, if needed in response. If not, can destructure it out here like before for response shaping.
        logger.debug(
          `Aggregated Ranking for ${
            rest.isStation ? "station" : "hunter"
          } ${ranking.callsign} has ${ranking.qsos.length} QSOs and ${
            ranking.points
          } points`,
        );
        return {
          ...rest,
          position: index + 1,
        };
      }),
  );

  const rankingsData = { stationRankings, userRankings };
  yearlyRankingsCache.data = rankingsData;
  yearlyRankingsCache.date = moment();
  res.json({ event: null, rankings: rankingsData });
});

export default router;
