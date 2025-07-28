import { Router } from "express";
import { body } from "express-validator";
import { INTERNAL_SERVER_ERROR } from "http-status";
import jwt from "jsonwebtoken";
import passport from "passport";
import { envs } from "../../../shared/envs";
import { logger } from "../../../shared/logger";
import { Errors } from "../../errors";
import { createError, validate } from "../../helpers";
import returnUserWithPosts from "../../middlewares/returnUserWithPosts";
import { AuthOptions } from "../shared";

const router = Router();

/**
 * @openapi
 * /api/auth/login:
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
  body("callsign")
    .isString()
    .isLength({ min: 1, max: 10 })
    .trim()
    .isAlphanumeric()
    .toUpperCase(),
  body("password")
    .isString()
    .trim()
    .isLength({ min: 8, max: 64 })
    .isStrongPassword({ minLength: 8, minSymbols: 0 }),
  validate,
  async (req, res, next) => {
    passport.authenticate(
      "login",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (_err: any, user: any) => {
        logger.debug("Logging in callsign " + user?.callsign);
        try {
          if (_err || !user) {
            if (_err) {
              logger.error("Error while logging in");
              logger.error(_err);
            }
            return next(_err || new Error(Errors.USER_NOT_FOUND));
          }

          req.login(user, { session: false }, async (err) => {
            if (err) {
              logger.error("Error in req.login");
              logger.error(err);
              return next(err);
            }

            const body = {
              _id: user._id,
              callsign: user.callsign,
              expiration: Date.now() + AuthOptions.AUTH_COOKIE_DURATION_MS,
            };
            const token = jwt.sign(body, envs.JWT_SECRET);

            logger.debug("Created new JWT token");
            logger.debug(body);

            res.cookie(AuthOptions.AUTH_COOKIE_NAME, token, {
              httpOnly: true,
              signed: true,
              maxAge: 1000 * 60 * 60 * 24 * 3,
            });

            req.user = user;

            logger.debug("Logged in callsign " + user.callsign);

            return next();
          });
        } catch (err) {
          logger.error("Error catch in login");
          logger.error(err);
          return res.status(INTERNAL_SERVER_ERROR).json(createError());
        }
      },
    )(req, res, next);
  },
  (req, res, next) => returnUserWithPosts(req, res, next),
);

export default router;
