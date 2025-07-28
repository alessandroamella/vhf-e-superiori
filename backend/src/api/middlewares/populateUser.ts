import { NextFunction, Request, Response } from "express";
import passport from "passport";
import { logger } from "../../shared";
import { User } from "../auth/models";
import { AuthOptions } from "../auth/shared";
import { Errors } from "../errors";

async function populateUser(req: Request, res: Response, next: NextFunction) {
  passport.authenticate(
    "jwt",
    { session: false },
    // biome-ignore lint/suspicious/noExplicitAny: we know user is an any type here
    async (_err: any, user: any) => {
      logger.debug("populateUser for callsign " + user?.callsign);

      if (_err) {
        logger.error("Error while authenticating in populateUser");
        logger.error(_err);
        req.user = undefined;
        return next(_err);
      }

      if (user) {
        const foundUser = await User.findOne(
          { _id: user._id },
          {
            password: 0,
            joinRequests: 0,
            verificationCode: 0,
            passwordResetCode: 0,
            __v: 0,
          },
        ).lean();
        if (!foundUser) {
          logger.error("User with valid token not found in populateUser");
          logger.error(user);
          res.clearCookie(AuthOptions.AUTH_COOKIE_NAME, {
            httpOnly: true,
            signed: true,
          });
          return next(new Error(Errors.SERVER_ERROR));
        }
        // Transform the lean document to match the expected req.user type
        // biome-ignore lint/suspicious/noExplicitAny: Needed for type conversion
        const userWithTimestamps = foundUser as any;
        req.user = {
          ...foundUser,
          createdAt: userWithTimestamps.createdAt.toISOString(),
          updatedAt: userWithTimestamps.updatedAt.toISOString(),
          _id: foundUser._id.toString(),
        } as unknown as typeof req.user;
        logger.debug("populateUser successful for user " + foundUser.callsign);
      } else req.user = undefined;
      next();
    },
  )(req, res, next);
}
export default populateUser;
