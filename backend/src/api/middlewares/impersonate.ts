import { NextFunction, Request, Response } from "express";
import { logger } from "../../shared";
import { User, UserDoc } from "../auth/models";

const impersonate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const user = req.user as UserDoc;
  if (!user?.isDev) {
    return next();
  }

  const impersonateId = req.header("x-impersonate-user");

  if (impersonateId && typeof impersonateId === "string") {
    try {
      const targetUser = await User.findById(impersonateId);

      if (targetUser) {
        logger.warn(
          `DEV ${user.callsign} is impersonating ${targetUser.callsign}`,
        );

        // Manteniamo un riferimento all'admin originale se serve,
        // ma per la logica dell'app, ora "siamo" l'utente target.
        req.user = targetUser;
      }
    } catch (err) {
      logger.error("Error during impersonation");
      logger.error(err);
    }
  }

  next();
};

export default impersonate;
