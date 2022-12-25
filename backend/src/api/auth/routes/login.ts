import { Router } from "express";
import passport from "passport";
import { Errors } from "../../errors";
import jwt from "jsonwebtoken";
import { envs } from "../../../shared/envs";
import { AuthOptions } from "../shared";
import { logger } from "../../../shared/logger";

const router = Router();

/**
 * @openapi
 * /auth/login:
 *  post:
 *    summary: Logs in with given callsign and password
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              callsign:
 *                type: string
 *              password:
 *                type: string
 *                format: password
 *            required:
 *              - callsign
 *              - password
 *    tags:
 *      - auth
 *    responses:
 *      '200':
 *        description: Logged in
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                token:
 *                  type: string
 *      '500':
 *        description: Server error
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ResErr'
 */
router.post("/", async (req, res, next) => {
    passport.authenticate("login", async (_err, user, info) => {
        logger.debug("Logging in callsign " + user?.callsign);
        try {
            if (_err || !user) {
                const err = new Error(
                    _err ? Errors.UNKNOWN_ERROR : Errors.USER_NOT_FOUND
                );
                return next(err);
            }

            req.login(user, { session: false }, err => {
                if (err) return next(err);

                const body = {
                    _id: user._id,
                    callsign: user.callsign,
                    expiration: Date.now() + AuthOptions.AUTH_COOKIE_DURATION_MS
                };
                const token = jwt.sign(body, envs.JWT_SECRET);

                logger.debug("Created new JWT token");
                logger.debug(body);

                res.cookie(AuthOptions.AUTH_COOKIE_NAME, token, {
                    httpOnly: true,
                    signed: true
                });

                return res.json({ token });
            });
        } catch (err) {
            return next(err);
        }
    })(req, res, next);
});

export default router;
