import passport from "passport";
import { Strategy as localStrategy } from "passport-local";
import { logger } from "../../../shared/logger";
import { Errors } from "../../errors";
import User from "../../user/models";

passport.use(
    "signup",
    new localStrategy(
        {
            usernameField: "email",
            passwordField: "password",
            passReqToCallback: true,
            session: false
        },
        async (req, email, password, done) => {
            try {
                const callsign = (req.body.callsign as string)
                    .trim()
                    .toUpperCase();
                email = email.trim().toLowerCase();
                password = password.trim();
                logger.debug("Signing up " + callsign + " with email " + email);
                logger.debug(
                    "Checking if callsign " +
                        callsign +
                        " or email " +
                        email +
                        " already exists"
                );
                const exists = await User.findOne({
                    $or: [{ callsign }, { email }]
                });
                if (exists) return done(new Error(Errors.ALREADY_REGISTERED));

                const user = await User.create({
                    callsign: req.body.callsign,
                    name: req.body.name,
                    email,
                    password,
                    isAdmin: false,
                    joinRequests: []
                });

                logger.debug(user);

                logger.info(req.body.callsign + " signed up!");
                return done(null, user);
            } catch (err) {
                logger.debug(err);
                done(err);
            }
        }
    )
);

passport.use(
    "login",
    new localStrategy(
        {
            usernameField: "callsign",
            passwordField: "password"
        },
        async (callsign, password, done) => {
            try {
                const user = await User.findOne({ callsign });

                if (!user) {
                    return done(null, false, {
                        message: Errors.USER_NOT_FOUND
                    });
                }

                const validate = await user.isValidPw(password);

                if (!validate) {
                    return done(null, false, { message: Errors.INVALID_PW });
                }

                return done(null, user, { message: "Logged in successfully" });
            } catch (err) {
                logger.debug(err);
                return done(err);
            }
        }
    )
);
