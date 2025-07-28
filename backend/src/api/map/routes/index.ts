import express, { Request, Response } from "express";
import { param } from "express-validator";
import { logger } from "../../../shared";
import type { UserDoc } from "../../auth/models";
import { Errors } from "../../errors";
import Event from "../../event/models";
import { createError, validate } from "../../helpers";
import isLoggedIn from "../../middlewares/isLoggedIn";
import { qrz } from "../../qrz";
import { Qso } from "../../qso/models";
import MapExporter from "..";

const router = express.Router();
const mapExporter = new MapExporter();

router.get(
  "/export-map/:event",
  param("event").isMongoId(),
  validate,
  isLoggedIn,
  async (req: Request, res: Response) => {
    const curUser = req.user;
    if (!curUser) {
      throw new Error("No req.user in user update");
    }
    try {
      logger.debug(
        `Exporting map of ${curUser.callsign} for event ${req.params.event}`,
      );
      const event = await Event.findOne({
        _id: req.params.event,
      });
      if (!event) {
        logger.warn(`Event not found for ${curUser.callsign}`);
        return res.status(404).json(createError(Errors.EVENT_NOT_FOUND));
      }

      // Fetch QSOs data
      const qsos = await Qso.find({
        event: event._id,
        $or: [
          { callsign: curUser.callsign },
          { fromStationCallsignOverride: curUser.callsign },
          { "fromStation.callsign": curUser.callsign },
        ],
      });

      if (qsos.length === 0) {
        logger.warn(`No QSOs found for ${curUser.callsign}`);
        return res.status(404).json(createError(Errors.QSO_NOT_FOUND));
      }

      const qrzData = await qrz.getInfo(curUser.callsign);

      // Export the map to JPG
      const buffer = await mapExporter.exportMapToJpg(
        event,
        curUser.callsign,
        qsos,
        qrzData?.pictureUrl,
      );

      // Return the image as a response
      res.writeHead(200, {
        "Content-Type": "image/jpeg",
        "Content-Length": buffer.length,
      });
      res.end(buffer);
    } catch (error) {
      console.error("Error in /export-map route:", error);
      res.status(500).json({ error: "Failed to export map" });
    }
  },
);

export default router;
