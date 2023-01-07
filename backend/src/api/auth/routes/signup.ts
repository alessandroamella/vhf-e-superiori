import { NextFunction, Request, Response, Router } from "express";
import { BAD_REQUEST, OK } from "http-status";
import passport from "passport";
import { checkSchema } from "express-validator";
import createSchema from "../schemas/createSchema";
import { createError, validate } from "../../helpers";
import User, { UserDoc } from "../../user/models";
import { logger } from "../../../shared";
import { Errors } from "../../errors";

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
 *            required:
 *              - callsign
 *              - name
 *              - password
 *              - email
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
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        passport.authenticate(
            "signup",
            { session: false },
            async (_err, user, info) => {
                if (_err || !user) {
                    logger.debug("_err");
                    logger.debug(_err);
                    logger.debug("user");
                    logger.debug(user);
                    return res
                        .status(BAD_REQUEST)
                        .json(
                            createError(
                                (_err as Error)?.message || Errors.UNKNOWN_ERROR
                            )
                        );
                }
                logger.debug("user");
                logger.debug(user);

                return res.json(
                    await User.findOne(
                        { _id: user._id },
                        { password: 0, joinRequests: 0, __v: 0 }
                    )
                );
            }
        )(req, res, next);
    }
);

export default router;
