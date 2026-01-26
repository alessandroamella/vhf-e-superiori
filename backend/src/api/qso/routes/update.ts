import { Request, Response, Router } from "express";
import { checkSchema, param } from "express-validator";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, UNAUTHORIZED } from "http-status";
import { pick } from "lodash";
import { logger } from "../../../shared";
import { User } from "../../auth/models";
import { Errors } from "../../errors";
import { createError, validate } from "../../helpers";
import { location } from "../../location";
import { Qso, type QsoDoc } from "../models";
import createSchema from "../schemas/createSchema";

const router = Router();

router.put(
  "/:_id",
  param("_id").isMongoId(),
  checkSchema(createSchema),
  validate,
  async (req: Request, res: Response) => {
    if (!req.user) throw new Error("No req.user in QSO update");

    try {
      const user = await User.findOne({ _id: req.user._id });
      if (!user) throw new Error("Can't find user in QSO update");

      const qso = await Qso.findOne({ _id: req.params._id });
      if (!qso)
        return res.status(BAD_REQUEST).json(createError(Errors.QSO_NOT_FOUND));

      // Allow if QSO owner, Admin, or Dev
      if (
        qso.fromStation.toString() !== user._id.toString() &&
        // using isAdmin middleware, this should not be needed, but just in case
        !user.isAdmin &&
        !user.isDev
      ) {
        return res.status(UNAUTHORIZED).json(createError(Errors.QSO_NOT_OWNED));
      }

      // Snapshot current state to check for changes
      const oldState = {
        fromStation: qso.fromStation.toString(),
        fromStationCallsignOverride: qso.fromStationCallsignOverride,
        callsign: qso.callsign,
        band: qso.band,
        mode: qso.mode,
        qsoDate: qso.qsoDate ? new Date(qso.qsoDate).toISOString() : null,
      };

      // Update fields
      const updates = pick(req.body, [
        "fromStation",
        "callsign",
        "frequency",
        "band",
        "mode",
        "qsoDate",
        "locator",
        "toLocator",
        "rst",
        "notes",
        "fromStationCallsignOverride",
        // Add location fields so they can be updated if sent
        "fromStationCity",
        "fromStationProvince",
        "fromStationLat",
        "fromStationLon",
        "email",
      ] satisfies (keyof QsoDoc | "toLocator")[]);

      // If fromStation changed, we should attempt to update the location data
      // from the new user, unless specific location data was sent in the body
      if (updates.fromStation && updates.fromStation !== oldState.fromStation) {
        const newStationUser = await User.findById(updates.fromStation);
        if (newStationUser) {
          // Only apply defaults if not explicitly provided in the update payload
          if (!updates.fromStationCity)
            updates.fromStationCity = newStationUser.city;
          if (!updates.fromStationProvince)
            updates.fromStationProvince = newStationUser.province;
          if (
            updates.fromStationLat === undefined &&
            newStationUser.lat !== undefined
          )
            updates.fromStationLat = newStationUser.lat;
          if (
            updates.fromStationLon === undefined &&
            newStationUser.lon !== undefined
          )
            updates.fromStationLon = newStationUser.lon;

          // If coordinates changed and no locator provided, clear old locator
          // so pre-save hook can recalculate it
          if (!updates.locator) {
            qso.locator = undefined;
          }
        }
      }

      // Apply updates
      Object.assign(qso, updates);

      // Check if visual fields changed to invalidate eQSL image
      const hasVisualChanges =
        qso.fromStation.toString() !== oldState.fromStation ||
        qso.fromStationCallsignOverride !==
          oldState.fromStationCallsignOverride ||
        qso.callsign !== oldState.callsign ||
        qso.band !== oldState.band ||
        qso.mode !== oldState.mode ||
        (qso.qsoDate &&
          new Date(qso.qsoDate).toISOString() !== oldState.qsoDate);

      if (hasVisualChanges) {
        logger.info(
          `QSO ${qso._id} updated critical fields, clearing cached eQSL imageHref`,
        );
        qso.imageHref = undefined;
        // Optionally reset emailSent if you want the UI to reflect it needs sending again
        // qso.emailSent = false;
      }

      if (updates.toLocator) {
        const latLon = location.calculateLatLon(updates.toLocator);
        if (latLon) {
          qso.toStationLat = latLon[0];
          qso.toStationLon = latLon[1];
          // We update these on the document directly
        }
      }

      await qso.save();

      // Return populated QSO (consistent with other endpoints)
      const populated = await qso.populate({
        path: "fromStation",
        select: "callsign isDev isAdmin",
      });

      const responseObj = {
        ...populated.toObject(),
        toLocator:
          populated.toStationLat && populated.toStationLon
            ? location.calculateQth(
                populated.toStationLat,
                populated.toStationLon,
              )
            : undefined,
        fromLocator:
          populated.fromStationLat && populated.fromStationLon
            ? location.calculateQth(
                populated.fromStationLat,
                populated.fromStationLon,
              )
            : undefined,
      };

      res.json(responseObj); // Send the object with the calculated locators
    } catch (err) {
      logger.error("Error while updating QSO");
      logger.error(err);
      res.status(INTERNAL_SERVER_ERROR).json(createError());
    }
  },
);

export default router;
