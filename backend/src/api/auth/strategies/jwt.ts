import passport from "passport";
import { Strategy as JWTstrategy, JwtFromRequestFunction } from "passport-jwt";
// import jwt from "jsonwebtoken";
import { envs } from "../../../shared/envs";
import { Errors } from "../../errors";
import { AuthOptions } from "../shared";

const cookieExtractor: JwtFromRequestFunction = req => {
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
            jwtFromRequest: cookieExtractor
        },
        (token, done) => {
            const { expiration } = token;

            if (Date.now() > expiration) {
                done(new Error(Errors.LOGIN_TOKEN_EXPIRED), false);
            }

            done(null, token);
        }
    )
);
