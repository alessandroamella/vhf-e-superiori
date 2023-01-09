import { NextFunction, Request, Response } from "express";
import passport from "passport";
import { logger } from "../../shared";
import { AuthOptions } from "../auth/shared";
import { Errors } from "../errors";
import User from "../auth/models";

async function populateUser(req: Request, res: Response, next: NextFunction) {
    passport.authenticate("jwt", { session: false }, async (_err, user) => {
        logger.debug("populateUser for callsign " + user?.callsign);

        if (_err) {
            logger.error("Error while authenticating in populateUser");
            logger.error(_err);

            return next(_err);
        }

        if (user) {
            const foundUser = await User.findOne(
                { _id: user._id },
                { password: 0, joinRequests: 0, __v: 0 }
            );
            if (!foundUser) {
                logger.error("User with valid token not found in populateUser");
                logger.error(user);
                res.clearCookie(AuthOptions.AUTH_COOKIE_NAME, {
                    httpOnly: true,
                    signed: true
                });
                return next(new Error(Errors.UNKNOWN_ERROR));
            }
            req.user = foundUser.toObject();
        } else req.user = undefined;
        next();
    })(req, res, next);
}
export default populateUser;
