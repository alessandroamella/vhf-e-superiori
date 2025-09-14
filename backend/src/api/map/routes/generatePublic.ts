import { readFile, unlink } from "node:fs/promises";
import { AdifParser } from "adif-parser-ts";
import express, { Request, Response } from "express";
import fileUpload from "express-fileupload";
import { body } from "express-validator";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "http-status";
import moment from "moment";
import { logger } from "../../../shared";
import { convertEdiToAdif } from "../../../utils/edi-to-adif";
import { ParsedAdif } from "../../adif/interfaces";
import { Errors } from "../../errors";
import type { EventDoc } from "../../event/models";
import { createError, validate } from "../../helpers";
import { location } from "../../location";
import checkCaptcha from "../../middlewares/checkCaptcha";
import { qrz } from "../../qrz";
import type { QsoDoc } from "../../qso/models";
import MapExporter from "..";

const router = express.Router();
const mapExporter = new MapExporter();

type DummyEvent = Pick<
  EventDoc,
  "id" | "name" | "date" | "offsetCallsign" | "offsetData" | "offsetFrom"
> & { _id: string };

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
 *              token:
 *                type: string
 *                description: Cloudflare Turnstile token for bot protection
 *              operatorCallsign:
 *                type: string
 *                description: Operator callsign for QRZ lookup
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
 *              qth:
 *                type: string
 *                description: Optional QTH (location) to geocode for from station coordinates when not available in ADIF
 *            required:
 *              - adif
 *              - token
 *              - operatorCallsign
 *              - eventTitle
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
 *        description: Invalid request or ADIF
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
  body("token").isString().notEmpty(),
  body("operatorCallsign").isString().trim().notEmpty(),
  body("eventTitle").isString().trim(),
  body("offsetCallsign").optional().isNumeric(),
  body("offsetData").optional().isNumeric(),
  body("offsetFrom").optional().isNumeric(),
  body("qth").optional().isString().trim(),
  validate,
  checkCaptcha,
  async (req: Request, res: Response) => {
    try {
      // Validate that ADIF or EDI file was uploaded
      if (!req.files || !req.files.adif) {
        logger.debug("No ADIF/EDI file uploaded");
        return res.status(BAD_REQUEST).json(createError(Errors.NO_CONTENT));
      }

      const _adif = req.files.adif;
      const uploadedFile: fileUpload.UploadedFile = Array.isArray(_adif)
        ? _adif[0]
        : _adif;

      let text: string;
      try {
        // Read the uploaded file
        text = await readFile(uploadedFile.tempFilePath, "utf-8");
        await unlink(uploadedFile.tempFilePath); // Clean up temp file
      } catch (error) {
        logger.error("Error reading uploaded file:", error);
        return res.status(BAD_REQUEST).json(createError(Errors.INVALID_ADIF));
      }

      // Helper function to detect if file is EDI format
      const isEdiFile = (content: string, filename: string): boolean => {
        // Check file extension
        if (filename.toLowerCase().endsWith(".edi")) {
          return true;
        }
        // Check content for EDI markers
        return (
          content.includes("[REG1TEST;1]") || content.includes("[QSORecords;")
        );
      };

      // Convert EDI to ADIF if needed
      if (isEdiFile(text, uploadedFile.name || "")) {
        try {
          logger.debug("EDI file detected, converting to ADIF");
          text = convertEdiToAdif(text);
          logger.debug("Successfully converted EDI to ADIF");
        } catch (error) {
          logger.error("Error converting EDI to ADIF:", error);
          return res.status(BAD_REQUEST).json(createError(Errors.INVALID_ADIF));
        }
      }

      let parsed: ParsedAdif;
      try {
        parsed = AdifParser.parseAdi(text) as unknown as ParsedAdif;
        logger.debug(`Parsed log with ${parsed.records.length} records`);
      } catch (error) {
        logger.error("Error parsing log file:", error);
        return res.status(BAD_REQUEST).json(createError(Errors.INVALID_ADIF));
      }

      if (!parsed.records || parsed.records.length === 0) {
        logger.debug("No QSO records found in log file");
        return res.status(BAD_REQUEST).json(createError(Errors.INVALID_ADIF));
      }

      // Get operator callsign from request (now mandatory)
      const operatorCallsign = req.body.operatorCallsign;

      // Get QRZ data if operator callsign is available
      let qrzData = null;
      try {
        qrzData = await qrz.getInfo(operatorCallsign);
        logger.debug(
          `QRZ lookup for ${operatorCallsign}: ${qrzData ? "found" : "not found"}`,
        );
      } catch (error) {
        logger.warn(`Error looking up ${operatorCallsign} on QRZ:`, error);
      }

      // If no QRZ data found and callsign has prefix/suffix, get the longest part
      let cleanCallsign = operatorCallsign;
      if (!qrzData) {
        const _callsigns: string[] = operatorCallsign.split("/");
        _callsigns.sort((a: string, b: string) => b.length - a.length);
        cleanCallsign = _callsigns[0];

        // Try QRZ lookup again with clean callsign if it's different
        if (cleanCallsign !== operatorCallsign) {
          try {
            qrzData = await qrz.getInfo(cleanCallsign);
            logger.debug(
              `QRZ lookup for clean callsign ${cleanCallsign}: ${qrzData ? "found" : "not found"}`,
            );
          } catch (error) {
            logger.warn(
              `Error looking up clean callsign ${cleanCallsign} on QRZ:`,
              error,
            );
          }
        }
      }

      // Geocode QTH if provided for fallback coordinates
      let fallbackFromStationLat: number | null = null;
      let fallbackFromStationLon: number | null = null;
      if (req.body.qth) {
        try {
          logger.debug(`Geocoding QTH: ${req.body.qth}`);
          const geocoded = location.calculateLatLon(req.body.qth);
          if (geocoded) {
            fallbackFromStationLat = geocoded[0];
            fallbackFromStationLon = geocoded[1];
            logger.debug(
              `QTH geocoded to: ${fallbackFromStationLat}, ${fallbackFromStationLon}`,
            );
          } else {
            // logger.warn(`Failed to geocode QTH: ${req.body.qth}`);
            return res
              .status(BAD_REQUEST)
              .json(createError(Errors.ERROR_QTH_PARSE));
          }
        } catch (error) {
          logger.warn(`Error geocoding QTH ${req.body.qth}:`, error);
        }
      }

      // Process QSO records
      const qsoData: Pick<
        QsoDoc,
        | "id"
        | "fromStationLat"
        | "fromStationLon"
        | "toStationLat"
        | "toStationLon"
      >[] = [];
      let fromStationLat: number | null = null;
      let fromStationLon: number | null = null;
      let fromLocator: string | null = null;

      for (const record of parsed.records) {
        logger.debug(`Processing QSO with ${record.call}`);

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
          } else if (fallbackFromStationLat && fallbackFromStationLon) {
            // Use geocoded QTH as fallback
            fromStationLat = fallbackFromStationLat;
            fromStationLon = fallbackFromStationLon;
            logger.debug(
              `Using geocoded QTH coordinates for ${record.call}: ${fromStationLat}, ${fromStationLon}`,
            );
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
        } else if (record.notes) {
          // Try to extract locator from notes field
          const trimmedNotes = record.notes.trim().toLowerCase();
          // Check if notes looks like a locator (4 or 6 characters: 2 letters + 2 digits + optionally 2 letters)
          const locatorPattern = /^[a-z]{2}[0-9]{2}[a-z]{0,2}$/;
          if (
            locatorPattern.test(trimmedNotes) &&
            (trimmedNotes.length === 4 || trimmedNotes.length === 6)
          ) {
            const coords = location.calculateLatLon(trimmedNotes);
            if (coords) {
              toStationLat = coords[0];
              toStationLon = coords[1];
              toLocator = trimmedNotes.toUpperCase();
              logger.debug(
                `Extracted locator ${toLocator} from notes for ${record.call}`,
              );
            }
          }
        }

        // Skip QSOs without valid coordinates
        if (
          !fromStationLat ||
          !fromStationLon ||
          !toStationLat ||
          !toStationLon
        ) {
          const obj = Object.entries({
            fromStationLat,
            fromStationLon,
            toStationLat,
            toStationLon,
          })
            .filter(([, v]) => !v)
            .map(([k]) => k);
          logger.debug(
            `Skipping QSO with ${record.call} - missing coordinates: ${obj.join(", ")}`,
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
        const qso = {
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
      const eventTitle = req.body.eventTitle;
      const dummyEvent: DummyEvent = {
        _id: `dummy-adif-export-${eventTitle}`,
        id: `dummy-adif-export-${eventTitle}`,
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
      logger.info(
        `Generating map for ${qsoData.length} QSOs from log file upload`,
      );
      const buffer = await mapExporter.exportMapToJpg(
        // biome-ignore lint/suspicious/noExplicitAny: type assertion needed for dummyEvent
        dummyEvent as any,
        operatorCallsign || null,
        qsoData,
        qrzData?.pictureUrl,
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
