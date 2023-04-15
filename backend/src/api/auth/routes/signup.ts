import { NextFunction, Request, Response, Router } from "express";
import passport from "passport";
import { body, checkSchema } from "express-validator";
import createSchema from "../schemas/createSchema";
import { createError, validate } from "../../helpers";
import { logger } from "../../../shared";
import checkCaptcha from "../../middlewares/checkCaptcha";
import { INTERNAL_SERVER_ERROR } from "http-status";
import returnUserWithPosts from "../../middlewares/returnUserWithPosts";

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
    checkCaptcha,
    async (req: Request, res: Response, next: NextFunction) => {
        passport.authenticate(
            "signup",
            { session: false },
            async (_err, user) => {
                if (_err || !user) {
                    logger.error("Error in user signup");
                    logger.error("_err");
                    logger.error(_err);
                    logger.error("user");
                    logger.error(user);
                    return res
                        .status(INTERNAL_SERVER_ERROR)
                        .json(createError());
                }
                logger.debug("user");
                logger.debug(user);

                return next();

                // return res.json(
                //     (
                //         await User.findOne(
                //             { _id: user._id },
                //             {
                //                 password: 0,
                //                 joinRequests: 0,
                //                 verificationCode: 0,
                //                 passwordResetCode: 0,
                //                 __v: 0
                //             }
                //         )
                //     )?.toObject()
                // );
            }
        )(req, res, next);
    },
    returnUserWithPosts
);

export default router;
