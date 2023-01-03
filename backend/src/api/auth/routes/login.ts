import { Router } from "express";
import passport from "passport";
import { Errors } from "../../errors";
import jwt from "jsonwebtoken";
import { envs } from "../../../shared/envs";
import { AuthOptions } from "../shared";
import { logger } from "../../../shared/logger";
import { body } from "express-validator";
import { validate } from "../../helpers";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "http-status";

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
router.post(
    "/",
    body("callsign").isString().trim(),
    body("password").isString().trim(),
    validate,
    async (req, res, next) => {
        passport.authenticate("login", async (_err, user) => {
            logger.debug("Logging in callsign " + user?.callsign);
            try {
                if (_err || !user) {
                    if (_err) {
                        logger.error("Error while logging in");
                        logger.error(_err);
                    }
                    return res
                        .status(_err ? INTERNAL_SERVER_ERROR : BAD_REQUEST)
                        .json(
                            _err ? Errors.UNKNOWN_ERROR : Errors.USER_NOT_FOUND
                        );
                }

                req.login(user, { session: false }, err => {
                    if (err) {
                        logger.error("Error in req.login");
                        logger.error(err);
                        return res
                            .status(INTERNAL_SERVER_ERROR)
                            .json(Errors.UNKNOWN_ERROR);
                    }

                    const body = {
                        _id: user._id,
                        callsign: user.callsign,
                        expiration:
                            Date.now() + AuthOptions.AUTH_COOKIE_DURATION_MS
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
                logger.error("Error catch in login");
                logger.error(err);
                return res
                    .status(INTERNAL_SERVER_ERROR)
                    .json(Errors.UNKNOWN_ERROR);
            }
        })(req, res, next);
    }
);

export default router;
