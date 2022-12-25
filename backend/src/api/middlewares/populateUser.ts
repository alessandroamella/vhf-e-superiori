import { NextFunction, Request, Response } from "express";
import { UNAUTHORIZED } from "http-status";
import { isValidObjectId } from "mongoose";
import { AuthOptions } from "../auth/shared";
import { Errors } from "../errors";
import { createError } from "../helpers";
import User from "../user/models";

async function populateUser(req: Request, res: Response, next: NextFunction) {
    if (!req?.user?._id) return next();
    if (isValidObjectId(req.user._id)) {
        const user = await User.findOne({ _id: req.user._id });
        if (user) {
            req.user = user;
            return next();
        }
    }
    res.clearCookie(AuthOptions.AUTH_COOKIE_NAME, {
        httpOnly: true,
        signed: true
    });
    return res.status(UNAUTHORIZED).json(createError(Errors.INVALID_LOGIN));
}
export default populateUser;
