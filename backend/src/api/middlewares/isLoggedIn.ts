import { NextFunction, Request, Response } from "express";
import { UNAUTHORIZED } from "http-status";
import { logger } from "../../shared";
import { Errors } from "../errors";
import { createError } from "../helpers";

async function isLoggedIn(req: Request, res: Response, next: NextFunction) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    logger.debug("isLoggedIn for callsign " + (req.user as any)?.callsign);
    if (req.user) return next();
    return res.status(UNAUTHORIZED).json(createError(Errors.NOT_LOGGED_IN));
}
export default isLoggedIn;
