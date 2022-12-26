import { NextFunction, Request, Response } from "express";
import { UNAUTHORIZED } from "http-status";
import { Errors } from "../errors";
import { createError } from "../helpers";

async function isAdmin(req: Request, res: Response, next: NextFunction) {
    if (req?.user?.isAdmin) return next();
    return res.status(UNAUTHORIZED).json(createError(Errors.NOT_AN_ADMIN));
}
export default isAdmin;
