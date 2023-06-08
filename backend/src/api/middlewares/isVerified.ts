/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";
import { UNAUTHORIZED } from "http-status";
import { logger } from "../../shared";
import { Errors } from "../errors";
import { createError } from "../helpers";

async function isVerified(req: Request, res: Response, next: NextFunction) {
    logger.debug("Running isVerified for user " + (req?.user as any)?.callsign);
    if ((req?.user as any)?.isVerified) return next();
    return res.status(UNAUTHORIZED).json(createError(Errors.USER_NOT_VERIFIED));
}
export default isVerified;
