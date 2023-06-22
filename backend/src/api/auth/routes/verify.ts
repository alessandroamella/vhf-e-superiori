import { Request, Response, Router } from "express";
import { createError, validate } from "../../helpers";
import { logger } from "../../../shared";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "http-status";
import { param } from "express-validator";
import bcrypt from "bcrypt";
import User from "../models";
import { Errors } from "../../errors";

const router = Router();

/**
 * @openapi
 * /auth/verify/{userId}/{verificationCode}:
 *  get:
 *    summary: Verifies an account
 *    parameters:
 *      - in: path
 *        name: userId
 *        schema:
 *          type: string
 *        required: true
 *        description: ObjectId of the user to verify
 *      - in: path
 *        name: verificationCode
 *        schema:
 *          type: string
 *        required: true
 *        description: Verification code
 *    tags:
 *      - auth
 *    responses:
 *      '200':
 *        description: Verified
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/User'
 *      '400':
 *        description: Invalid code or user ObjectId
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/User'
 *      '500':
 *        description: Server error
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ResErr'
 */
router.get(
    "/:_id/:code",
    param("_id").isMongoId(),
    param("code").isString().trim(),
    validate,
    async (req: Request, res: Response) => {
        try {
            const user = await User.findOne({ _id: req.params._id });
            if (!user)
                return res
                    .status(BAD_REQUEST)
                    .json(createError(Errors.USER_NOT_FOUND));
            else if (user.isVerified)
                return res
                    .status(BAD_REQUEST)
                    .json(createError(Errors.USER_ALREADY_VERIFIED));

            if (!user.verificationCode) {
                throw new Error(
                    "User has no verification code in verify route"
                );
            }

            const same = bcrypt.compareSync(
                req.params.code,
                user.verificationCode
            );

            logger.debug(
                `Compare ${req.params.code} and ${user.verificationCode}: ${same}`
            );

            if (same) {
                user.isVerified = true;
                user.verificationCode = undefined;
                await user.save();
                return res.redirect("/?confirmed=true");
                // return res.json(
                //     (
                //         await User.findOne(
                //             { _id: user._id },
                //             {
                //                 password: 0,
                //                 joinRequests: 0,
                //                 verificationCode: 0,
                //                 __v: 0
                //             }
                //         )
                //     )?.toObject()
                // );
            } else {
                return res
                    .status(BAD_REQUEST)
                    .json(createError(Errors.INVALID_VERIFICATION_CODE));
            }
        } catch (err) {
            logger.error("Error while verifying user");
            logger.error(err);
            res.status(INTERNAL_SERVER_ERROR).json(createError());
        }
    }
);

export default router;
