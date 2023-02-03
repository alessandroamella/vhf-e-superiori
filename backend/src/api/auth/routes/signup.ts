import { NextFunction, Request, Response, Router } from "express";
import passport from "passport";
import { body, checkSchema } from "express-validator";
import createSchema from "../schemas/createSchema";
import { createError, validate } from "../../helpers";
import User from "../models";
import { envs, logger } from "../../../shared";
import { Errors } from "../../errors";
import axios from "axios";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, OK } from "http-status";

const router = Router();

/**
 * @openapi
 * /auth/signup:
 *  post:
 *    summary: Creates a new account
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              callsign:
 *                type: string
 *                minLength: 1
 *                maxLength: 10
 *              name:
 *                type: string
 *                minLength: 1
 *                maxLength: 50
 *              password:
 *                type: string
 *                minLength: 8
 *                maxLength: 64
 *                format: password
 *              email:
 *                type: string
 *                format: email
 *              token:
 *                type: string
 *                description: ReCAPTCHA token
 *            required:
 *              - callsign
 *              - name
 *              - password
 *              - email
 *              - token
 *    tags:
 *      - auth
 *    responses:
 *      '200':
 *        description: Signed up successfully
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/User'
 *      '400':
 *        description: Data validation failed
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ResErr'
 *      '500':
 *        description: Server error
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ResErr'
 */
router.post(
    "/",
    checkSchema(createSchema),
    body("token").isString().notEmpty(),
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const ip = req.socket.remoteAddress;
            logger.debug("Checking CAPTCHA to");
            logger.debug(
                `https://www.google.com/recaptcha/api/siteverify?secret=${
                    envs.RECAPTCHA_SECRET
                }&response=${req.body.token}${ip ? "&remoteip=" + ip : ""}`
            );
            const res = await axios.post(
                `https://www.google.com/recaptcha/api/siteverify?secret=${
                    envs.RECAPTCHA_SECRET
                }&response=${req.body.token}${ip ? "&remoteip=" + ip : ""}`
            );
            if (res.status !== OK) throw new Error(Errors.CAPTCHA_FAILED);
            next();
        } catch (err) {
            if (err instanceof Error && err.message === Errors.CAPTCHA_FAILED) {
                logger.debug("Captcha fail");
                logger.debug(err);
                return res
                    .status(BAD_REQUEST)
                    .json(createError(Errors.CAPTCHA_FAILED));
            }
            logger.error("Error in signup CAPTCHA verification");
            logger.error(err);
            return res.status(INTERNAL_SERVER_ERROR).json(createError());
        }
    },
    async (req: Request, res: Response, next: NextFunction) => {
        passport.authenticate(
            "signup",
            { session: false },
            async (_err, user) => {
                if (_err || !user) {
                    logger.debug("_err");
                    logger.debug(_err);
                    logger.debug("user");
                    logger.debug(user);
                    return next(_err || new Error(Errors.UNKNOWN_ERROR));
                }
                logger.debug("user");
                logger.debug(user);

                return res.json(
                    (
                        await User.findOne(
                            { _id: user._id },
                            {
                                password: 0,
                                joinRequests: 0,
                                verificationCode: 0,
                                __v: 0
                            }
                        )
                    )?.toObject()
                );
            }
        )(req, res, next);
    }
);

export default router;
