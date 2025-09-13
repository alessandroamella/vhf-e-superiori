import { readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { AdifParser } from "adif-parser-ts";
import express, { NextFunction, Request, Response } from "express";
import fileUpload from "express-fileupload";
import { body } from "express-validator";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "http-status";
import moment from "moment";
import { logger } from "../../../shared";
import { ParsedAdif } from "../../adif/interfaces";
import { EdiToAdifConverter } from "../../adif/utils/edi-to-adif";
import { Errors } from "../../errors";
import { createError, validate } from "../../helpers";
import { location } from "../../location";
import checkCaptcha from "../../middlewares/checkCaptcha";
import { qrz } from "../../qrz";
import MapExporter from "..";

const router = express.Router();
const mapExporter = new MapExporter();

interface DummyEvent {
  _id: string;
  id: string;
  name: string;
  date: Date;
  offsetCallsign?: number;
  offsetData?: number;
  offsetFrom?: number;
}

interface QsoLikeData {
  fromStationLat: number;
  fromStationLon: number;
  toStationLat: number;
  toStationLon: number;
  callsign: string;
  mode?: string;
  frequency?: string;
  band?: string;
  qsoDate: Date;
  fromLocator?: string;
  toLocator?: string;
  notes?: string;
  rst?: number;
  fromStationCallsignOverride?: string;
}

/**
 * @openapi
 * /api/map/generate-adif-public:
 *  post:
 *    summary: Generate QSO map from ADIF or EDI file for non-registered users
 *    requestBody:
 *      required: true
 *      content:
 *        multipart/form-data:
 *          schema:
 *            type: object
 *            properties:
 *              adif:
 *                type: string
 *                format: binary
 *                description: ADIF or EDI file to process
 *              turnstileToken:
 *                type: string
 *                description: Cloudflare Turnstile token for bot protection
 *              operatorCallsign:
 *                type: string
 *                description: Optional operator callsign for QRZ lookup
 *              eventTitle:
 *                type: string
 *                description: Optional custom title for the map
 *              offsetCallsign:
 *                type: number
 *                description: Optional callsign text position offset
 *              offsetData:
 *                type: number
 *                description: Optional data text position offset
 *              offsetFrom:
 *                type: number
 *                description: Optional from text position offset
 *            required:
 *              - adif
 *              - turnstileToken
 *    tags:
 *      - map
 *    responses:
 *      '200':
 *        description: Generated map image
 *        content:
 *          image/jpeg:
 *            schema:
 *              type: string
 *              format: binary
 *      '400':
 *        description: Invalid request, ADIF, or EDI
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
  "/generate-adif-public",
  body("turnstileToken").isString().notEmpty(),
  body("operatorCallsign").optional().isString().trim(),
  body("eventTitle").optional().isString().trim(),
  body("offsetCallsign").optional().isNumeric(),
  body("offsetData").optional().isNumeric(),
  body("offsetFrom").optional().isNumeric(),
  validate,
  (req: Request, _res: Response, next: NextFunction) => {
    // Map turnstileToken to token for checkCaptcha middleware
    req.body.token = req.body.turnstileToken;
    next();
  },
  checkCaptcha, // This expects turnstileToken in body as "token"
  async (req: Request, res: Response) => {
    try {
      // Validate that ADIF/EDI file was uploaded
      if (!req.files || !req.files.adif) {
        logger.debug("No ADIF/EDI file uploaded");
        return res.status(BAD_REQUEST).json(createError(Errors.NO_CONTENT));
      }

      const _adif = req.files.adif;
      const uploadedFile: fileUpload.UploadedFile = Array.isArray(_adif)
        ? _adif[0]
        : _adif;

      let text: string;
      let fileExtension: string;
      try {
        // Read the uploaded file
        text = await readFile(uploadedFile.tempFilePath, "utf-8");
        fileExtension = path.extname(uploadedFile.name || "").toLowerCase();
        await unlink(uploadedFile.tempFilePath); // Clean up temp file
      } catch (error) {
        logger.error("Error reading uploaded file:", error);
        return res.status(BAD_REQUEST).json(createError(Errors.INVALID_ADIF));
      }

      // Convert EDI to ADIF if necessary
      if (fileExtension === ".edi") {
        try {
          logger.debug("Converting EDI file to ADIF format");
          const conversionResult = EdiToAdifConverter.convert(text);

          if (!conversionResult.success) {
            logger.error("EDI to ADIF conversion failed");
            return res
              .status(BAD_REQUEST)
              .json(createError(Errors.INVALID_ADIF));
          }

          text = conversionResult.adifData;
          logger.debug(
            `Converted EDI to ADIF: ${conversionResult.qsoCount.wrote} QSOs converted`,
          );
        } catch (error) {
          logger.error("Error converting EDI to ADIF:", error);
          return res.status(BAD_REQUEST).json(createError(Errors.INVALID_ADIF));
        }
      }

      let parsed: ParsedAdif;
      try {
        parsed = AdifParser.parseAdi(text) as unknown as ParsedAdif;
        console.log({ text, parsed });
        logger.debug(`Parsed ADIF with ${parsed.records.length} records`);
      } catch (error) {
        logger.error("Error parsing ADIF:", error);
        return res.status(BAD_REQUEST).json(createError(Errors.INVALID_ADIF));
      }

      if (!parsed.records || parsed.records.length === 0) {
        logger.debug("No QSO records found in ADIF");
        return res.status(BAD_REQUEST).json(createError(Errors.INVALID_ADIF));
      }

      // Get operator callsign from request or try to infer from ADIF
      let operatorCallsign = req.body.operatorCallsign;
      if (!operatorCallsign) {
        // Try to get from first record's station_callsign or operator fields
        const firstRecord = parsed.records[0];
        operatorCallsign = firstRecord.station_callsign || firstRecord.operator;
      }

      // Get QRZ data if operator callsign is available
      let qrzData = null;
      let profilePicUrl: string | undefined;
      if (operatorCallsign) {
        try {
          qrzData = await qrz.getInfo(operatorCallsign);
          profilePicUrl = qrzData?.pictureUrl;
          logger.debug(
            `QRZ lookup for ${operatorCallsign}: ${qrzData ? "found" : "not found"}`,
          );
        } catch (error) {
          logger.warn(`Error looking up ${operatorCallsign} on QRZ:`, error);
        }
      }

      // Process QSO records
      const qsoData: QsoLikeData[] = [];
      let fromStationLat: number | null = null;
      let fromStationLon: number | null = null;
      let fromLocator: string | null = null;

      for (const record of parsed.records) {
        // Extract coordinates and locators
        let toStationLat: number | null = null;
        let toStationLon: number | null = null;
        let toLocator: string | null = null;

        // Parse station coordinates (my station)
        if (!fromStationLat && !fromStationLon) {
          if (record.my_lat && record.my_lon) {
            fromStationLat = parseFloat(record.my_lat);
            fromStationLon = parseFloat(record.my_lon);
          } else if (record.my_gridsquare) {
            const coords = location.calculateLatLon(record.my_gridsquare);
            if (coords) {
              fromStationLat = coords[0];
              fromStationLon = coords[1];
              fromLocator = record.my_gridsquare;
            }
          }
        }

        // Parse contacted station coordinates
        if (record.lat && record.lon) {
          toStationLat = parseFloat(record.lat);
          toStationLon = parseFloat(record.lon);
        } else if (record.gridsquare) {
          const coords = location.calculateLatLon(record.gridsquare);
          if (coords) {
            toStationLat = coords[0];
            toStationLon = coords[1];
            toLocator = record.gridsquare;
          }
        }

        // Skip QSOs without valid coordinates
        if (
          !fromStationLat ||
          !fromStationLon ||
          !toStationLat ||
          !toStationLon
        ) {
          logger.debug(
            `Skipping QSO with ${record.call} - missing coordinates`,
          );
          continue;
        }

        // Parse QSO date/time
        let qsoDate: Date;
        try {
          const dateStr = record.qso_date || moment().format("YYYYMMDD");
          const timeStr = record.time_on || "0000";
          qsoDate = moment(`${dateStr}-${timeStr}`, "YYYYMMDD-HHmmss").toDate();
        } catch {
          logger.warn(
            `Invalid date/time for QSO with ${record.call}, using current time`,
          );
          qsoDate = new Date();
        }

        // Create QSO-like object
        const qso: QsoLikeData = {
          fromStationLat,
          fromStationLon,
          toStationLat,
          toStationLon,
          callsign: record.call,
          mode: record.mode,
          frequency: record.freq,
          band: record.band,
          qsoDate,
          fromLocator: fromLocator || undefined,
          toLocator: toLocator || undefined,
          notes: record.comment,
          rst: record.rst_sent ? parseInt(record.rst_sent, 10) : undefined,
          fromStationCallsignOverride: operatorCallsign,
        };

        qsoData.push(qso);
      }

      if (qsoData.length === 0) {
        logger.debug("No valid QSOs found after processing");
        return res.status(BAD_REQUEST).json(createError(Errors.QSO_NOT_FOUND));
      }

      // Create dummy event object
      const eventTitle = req.body.eventTitle || "Mappa ADIF Generata";
      const dummyEvent: DummyEvent = {
        _id: "dummy-event-id",
        id: "dummy-event-id",
        name: eventTitle,
        date: new Date(),
        offsetCallsign: req.body.offsetCallsign
          ? parseInt(req.body.offsetCallsign, 10)
          : undefined,
        offsetData: req.body.offsetData
          ? parseInt(req.body.offsetData, 10)
          : undefined,
        offsetFrom: req.body.offsetFrom
          ? parseInt(req.body.offsetFrom, 10)
          : undefined,
      };

      // Generate map image
      logger.info(`Generating map for ${qsoData.length} QSOs from ADIF upload`);
      const buffer = await mapExporter.exportMapToJpg(
        // biome-ignore lint/suspicious/noExplicitAny: type assertion needed for dummyEvent
        dummyEvent as any,
        operatorCallsign || "UNKNOWN",
        // biome-ignore lint/suspicious/noExplicitAny: type assertion needed for qsoData
        qsoData as any,
        profilePicUrl,
        true, // hasAllQsos = true for public generation
      );

      // Return image as response
      res.writeHead(200, {
        "Content-Type": "image/jpeg",
        "Content-Length": buffer.length,
        "Content-Disposition": `attachment; filename="mappa-adif-${operatorCallsign || "collegamenti"}-${moment().format("YYYYMMDD")}.jpg"`,
      });
      res.end(buffer);
    } catch (error) {
      logger.error("Error in generate-adif-public route:", error);
      res.status(INTERNAL_SERVER_ERROR).json(createError(Errors.SERVER_ERROR));
    }
  },
);

export default router;
