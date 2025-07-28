import { NextFunction, Request, Response, Router } from "express";
import { body, checkSchema } from "express-validator";
import { BAD_REQUEST } from "http-status";
import passport from "passport";
import { logger } from "../../../shared";
import { createError, validate } from "../../helpers";
import checkCaptcha from "../../middlewares/checkCaptcha";
import returnUserWithPosts from "../../middlewares/returnUserWithPosts";
import createSchema from "../schemas/createSchema";

const router = Router();

/**
 * @openapi
 * /api/auth/signup:
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
 *              address:
 *                type: string
 *              lat:
 *                type: number
 *                format: float
 *              lon:
 *                type: number
 *                format: float
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (_err: any, user: any) => {
        if (_err || !user) {
          logger.debug("Error in user signup");
          logger.debug("_err");
          logger.debug(_err);
          logger.debug("user");
          logger.debug(user);
          return res
            .status(BAD_REQUEST)
            .json(createError(_err?.message || _err));
        }
        logger.debug("user");
        logger.debug(user);

        req.user = user;

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
      },
    )(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) =>
    returnUserWithPosts(req, res, next),
);

export default router;
