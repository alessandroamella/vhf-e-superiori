import { NextFunction, Request, Response } from "express";
import { UNAUTHORIZED } from "http-status";
import { logger } from "../../shared";
import { UserDoc } from "../auth/models";
import { Errors } from "../errors";
import { createError } from "../helpers";

async function isAdmin(req: Request, res: Response, next: NextFunction) {
  const user = req.user as Partial<UserDoc> | undefined;

  logger.debug(
    "Running isAdmin for user " + user?.callsign + " = " + !!user?.isAdmin,
  );
  if (user?.isAdmin) return next();
  return res.status(UNAUTHORIZED).json(createError(Errors.NOT_AN_ADMIN));
}
export default isAdmin;
