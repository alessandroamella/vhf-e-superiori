/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";
import { UNAUTHORIZED } from "http-status";
import { logger } from "../../shared";
import { Errors } from "../errors";
import { createError } from "../helpers";

async function isAdmin(req: Request, res: Response, next: NextFunction) {
    logger.debug(
        "Running isAdmin for user " +
            (req?.user as any)?.callsign +
            " = " +
            !!(req?.user as any)?.isAdmin
    );
    if ((req?.user as any)?.isAdmin) return next();
    return res.status(UNAUTHORIZED).json(createError(Errors.NOT_AN_ADMIN));
}
export default isAdmin;
