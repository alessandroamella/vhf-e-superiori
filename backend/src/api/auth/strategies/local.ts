import passport from "passport";
import { Strategy as localStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { logger } from "../../../shared/logger";
import { Errors } from "../../errors";
import User from "../models";

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
                const phoneNumber = (req.body.callsign as string)
                    .trim()
                    .toUpperCase();
                logger.info("Signing up " + callsign + " with email " + email);
                logger.debug(
                    "Checking if callsign " +
                        callsign +
                        " or email " +
                        email +
                        " or phoneNumber " +
                        phoneNumber +
                        " already exists"
                );
                logger.debug("Password = " + password);
                const exists = await User.exists({
                    $or: [{ callsign }, { email }, { phoneNumber }]
                });
                if (exists) return done(new Error(Errors.ALREADY_REGISTERED));

                const plainPw = password;
                const salt = await bcrypt.genSalt(10);

                const user = await User.create({
                    callsign: req.body.callsign,
                    name: req.body.name,
                    email,
                    phoneNumber,
                    password: await bcrypt.hash(plainPw, salt),
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
