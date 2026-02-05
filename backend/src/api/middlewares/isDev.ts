import { NextFunction, Request, Response } from "express";
import { UNAUTHORIZED } from "http-status";
import { Errors } from "../errors";
import { createError } from "../helpers";

export default function isDev(req: Request, res: Response, next: NextFunction) {
  if (req.user?.isDev) {
    return next();
  }
  return res.status(UNAUTHORIZED).json(createError(Errors.NOT_AN_ADMIN));
}
