import { Request, Response, Router } from "express";
import { checkSchema, param } from "express-validator";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, UNAUTHORIZED } from "http-status";
import { pick } from "lodash";
import { logger } from "../../../shared";
import { User } from "../../auth/models";
import { Errors } from "../../errors";
import { createError, validate } from "../../helpers";
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

      // Update fields
      const updates = pick(req.body, [
        "fromStation",
        "callsign",
        "frequency",
        "band",
        "mode",
        "qsoDate",
        "locator",
        "rst",
        "notes",
        "fromStationCallsignOverride",
      ] satisfies (keyof QsoDoc)[]);

      // Apply updates
      Object.assign(qso, updates);

      await qso.save();

      // Return populated QSO (consistent with other endpoints)
      const populated = await qso.populate({
        path: "fromStation",
        select: "callsign isDev isAdmin",
      });

      res.json(populated);
    } catch (err) {
      logger.error("Error while updating QSO");
      logger.error(err);
      res.status(INTERNAL_SERVER_ERROR).json(createError());
    }
  },
);

export default router;
