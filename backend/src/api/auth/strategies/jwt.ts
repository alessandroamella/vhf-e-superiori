import passport from "passport";
import { Strategy as JWTstrategy, JwtFromRequestFunction } from "passport-jwt";
import { logger } from "../../../shared";
// import jwt from "jsonwebtoken";
import { envs } from "../../../shared/envs";
import { Errors } from "../../errors";
import { User } from "../models";
import { AuthOptions } from "../shared";

const cookieExtractor: JwtFromRequestFunction = (req) => {
  if (
    !req ||
    !req.signedCookies ||
    !req.signedCookies[AuthOptions.AUTH_COOKIE_NAME]
  ) {
    return null;
  }
  // return jwt.verify(
  //     req.signedCookies[AuthOptions.AUTH_COOKIE_NAME],
  //     envs.JWT_SECRET
  // );
  return req.signedCookies[AuthOptions.AUTH_COOKIE_NAME];
};

passport.use(
  "jwt",
  new JWTstrategy(
    {
      secretOrKey: envs.JWT_SECRET,
      jwtFromRequest: cookieExtractor,
    },
    async (token, done) => {
      const { expiration } = token;

      if (Date.now() > expiration) {
        logger.debug("JWT error " + Errors.LOGIN_TOKEN_EXPIRED);
        done(new Error(Errors.LOGIN_TOKEN_EXPIRED), false);
      }

      try {
        const user = await User.findOne(
          { _id: token._id },
          {
            password: 0,
            joinRequests: 0,
            verificationCode: 0,
            passwordResetCode: 0,
            __v: 0,
          },
        );
        done(null, user?.toJSON() || undefined);
      } catch (err) {
        logger.error("Error while finding user in jwt strategy");
        logger.error(err);
        done(err);
      }
    },
  ),
);
