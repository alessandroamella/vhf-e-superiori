import { AdifFormatter, AdifParser, SimpleAdif } from "adif-parser-ts";

import { Router } from "express";
import { body, query } from "express-validator";
import { readFile, unlink, writeFile } from "fs/promises";
import { BAD_REQUEST } from "http-status";
import moment from "moment";
import path from "path";
import { envs } from "../../../shared";
import { logger } from "../../../shared/logger";
import { User, UserDoc } from "../../auth/models";
import { Errors } from "../../errors";
import Event from "../../event/models";
import { createError, validate } from "../../helpers";
import { location } from "../../location";
import isLoggedIn from "../../middlewares/isLoggedIn";
import { Qso } from "../../qso/models";
import { getEventDate } from "../../utils/eventDate";
import { ParsedAdif } from "../interfaces";

const router = Router();

type Exclusion = {
  callsign: string;
  index: number;
};

function parseExclude(exclude: string): Exclusion[] {
  return JSON.parse(exclude).map((e: string) => JSON.parse(e));
}

/**
 * @openapi
 * /api/adif/import:
 *  post:
 *    summary: Parse ADIF file. MUST CONTAIN adif FILE
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              event:
 *                type: string
 *                format: ObjectId
 *                description: The event the QSO is related to
 *            required:
 *              - event
 *    tags:
 *      - adif
 *    responses:
 *      '200':
 *        description: Parsed ADIF
 *      '400':
 *        description: Invalid ADIF
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ResErr'
 *      '401':
 *        description: Not logged in
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
router.post(
  "/import",
  body("event").isMongoId(),
  body("exclude")
    .optional()
    .custom((value) => {
      if (typeof value !== "string") {
        logger.debug("Invalid exclude object: not a string");
        throw new Error("Invalid exclude object");
      }
      const obj = parseExclude(value);

      if (
        obj.some(
          (e: Exclusion) =>
            typeof e.callsign !== "string" || typeof e.index !== "number",
        )
      ) {
        logger.debug("Invalid exclude object");
        throw new Error("Invalid exclude object");
      }
      return true;
    })
    .withMessage(Errors.INVALID_ADIF_EXCLUDE),
  body("save").optional().isBoolean().toBoolean(),
  body("fromStationCity").optional().isString(),
  body("fromStationProvince").optional().isString(),
  body("fromStationLat").optional().isNumeric(),
  body("fromStationLon").optional().isNumeric(),
  validate,
  isLoggedIn,
  async (req, res) => {
    if (!req.user) {
      throw new Error("No req.user in ADIF import");
    } else if (!req.files) {
      logger.info("No files to upload");
      return res.status(BAD_REQUEST).json(createError(Errors.NO_CONTENT));
    }

    const _adif = req.files.adif;
    if (!_adif) {
      logger.debug("No adif file");
      return res.status(BAD_REQUEST).json(createError(Errors.INVALID_ADIF));
    }
    const adif = Array.isArray(_adif) ? _adif[0] : _adif;

    const user = await User.findOne({
      _id: (req.user as unknown as UserDoc)._id,
    });
    if (!user) {
      throw new Error("User not found in ADIF import");
    }

    const event = await Event.findOne({
      _id: req.body.event,
      ...getEventDate(user),
    });
    if (!event) {
      return res.status(BAD_REQUEST).json(createError(Errors.EVENT_NOT_FOUND));
    }

    // no longer required
    // if (!user.isAdmin) {
    //     const joinRequest = await JoinRequest.findOne({
    //         forEvent: event._id,
    //         fromUser: user._id
    //     });
    //     if (!joinRequest) {
    //         return res
    //             .status(BAD_REQUEST)
    //             .json(createError(Errors.JOIN_REQUEST_NOT_FOUND));
    //     }
    // }

    const { save } = req.body; // toBoolean already converts to boolean

    try {
      const text = await readFile(adif.tempFilePath, "utf-8");
      await unlink(adif.tempFilePath);

      // logger.debug("Parsing text");
      // logger.debug(text);

      const parsed = AdifParser.parseAdi(text) as unknown as ParsedAdif;

      // logger.debug("Parsed ADIF");
      // logger.debug(parsed);

      const exclude = req.body.exclude ? parseExclude(req.body.exclude) : [];

      const qsos = [];
      for (const [i, q] of parsed.records.entries()) {
        if (exclude.some((e) => e.callsign === q.call && e.index === i)) {
          logger.debug("Excluding QSO with " + q.call);
          continue;
        }

        let lat, lon;
        if (q.address && save) {
          const fromLocator =
            q.gridsquare && location.calculateLatLon(q.gridsquare);
          if (fromLocator) {
            lat = fromLocator[0];
            lon = fromLocator[1];

            logger.debug(
              `Using locator ${q.gridsquare} for ${q.call} - ${q.freq} - ${lat}, ${lon}`,
            );
          } else {
            // don't geocode if not saving
            const addr = await location.geocode(q.address);

            lat = addr?.geometry.location.lat;
            lon = addr?.geometry.location.lng;

            logger.debug(
              `Geocoded ${q.address} for ${q.call} - ${q.freq} to ${addr?.formatted_address} - ${lat}, ${lon}`,
            );
          }
        }

        let locator;
        try {
          locator = location.calculateQth(
            parseInt(req.body.fromStationLat),
            parseInt(req.body.fromStationLon),
          );
        } catch (err) {
          logger.debug("Error while calculating locator");
          logger.debug(err);
        }

        const qso = await new Qso({
          fromStation: user._id,
          fromStationCity: req.body.fromStationCity,
          fromStationProvince: req.body.fromStationProvince,
          fromStationLat: parseInt(req.body.fromStationLat),
          fromStationLon: parseInt(req.body.fromStationLon),
          callsign: q.call,
          mode: q.mode,
          frequency: q.freq,
          band: q.band,
          qsoDate: moment(
            q.qso_date + "-" + q.time_on,
            "YYYYMMDD-HHmmss", // date is YYYYMMDD, time is HHMMSS
          ).toDate(),
          toStationLat: lat,
          toStationLon: lon,
          event: event._id,
          notes: q.comment,
          locator: q.gridsquare || locator,
          rst: parseInt(q.rst_sent) || 59,
          email: q.email,
        }).populate({
          path: "fromStation",
          select: "callsign",
        });
        if (save) await qso.save();
        qsos.push(qso);
      }

      logger.debug("Parsed ADIF with " + qsos.length + " QSOs");

      res.json(qsos);
    } catch (err) {
      logger.warn("Error while parsing ADIF");
      logger.warn(err);
      res.status(BAD_REQUEST).json(createError(Errors.INVALID_ADIF));
    }
  },
);

/**
 * @openapi
 * /api/adif/export:
 *  get:
 *    summary: Export given QSOs to ADIF file
 *    parameters:
 *      - in: path
 *        name: qsos
 *        schema:
 *          type: string
 *        required: true
 *        description: Comma separated list of QSO ObjectIds
 *      - in: path
 *        name: event
 *        schema:
 *          type: string
 *          format: ObjectId
 *        required: true
 *        description: The event the QSOs are related to
 *    tags:
 *      - adif
 *    responses:
 *      '200':
 *        description: ADIF file
 *      '400':
 *        description: Invalid QSOs
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ResErr'
 *      '401':
 *        description: Not logged in
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
  "/export",
  query("qsos")
    .isString()
    .custom((value) => {
      if (!value.match(/^[0-9a-fA-F]{24}(,[0-9a-fA-F]{24})*$/)) {
        throw new Error("Invalid QSOs");
      }
      return true;
    }),
  query("event").isMongoId(),

  validate,
  isLoggedIn,
  async (req, res) => {
    if (!req.user) {
      throw new Error("No req.user in ADIF export");
    }

    const user = await User.findOne({
      _id: (req.user as unknown as UserDoc)._id,
    });
    if (!user) {
      throw new Error("User not found in ADIF export");
    }

    const event = await Event.findOne({
      _id: req.query.event,
      ...getEventDate(user),
    });
    if (!event) {
      return res.status(BAD_REQUEST).json(createError(Errors.EVENT_NOT_FOUND));
    }

    // no longer required
    // if (!user.isAdmin) {
    //     const joinRequest = await JoinRequest.findOne({
    //         forEvent: event._id,
    //         fromUser: user._id
    //     });
    //     if (!joinRequest) {
    //         return res
    //             .status(BAD_REQUEST)
    //             .json(createError(Errors.JOIN_REQUEST_NOT_FOUND));
    //     }
    // }

    const qsos = await Qso.find({
      _id: { $in: (req.query.qsos as string).split(",") },
    });

    if (qsos.length === 0) {
      return res.status(BAD_REQUEST).json(createError(Errors.DOC_NOT_FOUND));
    }

    const obj: SimpleAdif = {
      header: {
        adif_ver: "3.1.0",
        programid: "VHFeSuperiori",
        programversion: "0.0.1",
      },
      records: qsos.map((q) => {
        return {
          call: q.callsign,
          mode: q.mode,
          band: q.band,
          qso_date: moment(q.qsoDate).format("YYYYMMDD"),
          time_on: moment(q.qsoDate).format("HHmmss"),
        };
      }),
    };

    const adif = AdifFormatter.formatAdi(obj);

    // save to temp file
    const fileName = `vhfesuperiori_export_${moment().format(
      "YYYYMMDDHHmmss",
    )}.adi`;
    const tempFile = path.join(
      envs.BASE_TEMP_DIR,
      envs.FILE_UPLOAD_TMP_FOLDER,
      fileName,
    );
    await writeFile(tempFile, adif);

    res.download(tempFile, fileName, async () => {
      await unlink(tempFile);
    });
  },
);

export default router;
