import { Router } from "express";
import bcrypt from "bcrypt";
import { INTERNAL_SERVER_ERROR, OK, UNAUTHORIZED } from "http-status";
import { Errors } from "../../errors";
import { logger } from "../../../shared/logger";
import { body } from "express-validator";
import { createError, validate } from "../../helpers";
import { User, UserDoc } from "../models";

const router = Router();

/**
 * @openapi
 * /api/auth/changepw:
 *  post:
 *    summary: Changes password (needs to be logged in)
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              oldPassword:
 *                type: string
 *                format: password
 *              newPassword:
 *                type: string
 *                format: password
 *            required:
 *              - oldPassword
 *              - newPassword
 *    tags:
 *      - auth
 *    responses:
 *      '200':
 *        description: Password changed
 *      '401':
 *        description: Incorrect password or not logged in
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
    body("oldPassword").isString(),
    body("newPassword")
        .isString()
        .trim()
        .isStrongPassword({ minLength: 8, minSymbols: 0 })
        .withMessage(Errors.WEAK_PW),
    validate,
    async (req, res) => {
        if (!req.user) {
            throw new Error("No req.user in user change pw");
        }
        try {
            const user = await User.findOne({
                _id: (req.user as unknown as UserDoc)._id
            });
            if (!user) {
                throw new Error("Can't find user in user change pw");
            }

            const isValid = await user.isValidPw(req.body.oldPassword);
            if (!isValid) {
                logger.debug("User change pw invalid pw");
                return res
                    .status(UNAUTHORIZED)
                    .json(createError(Errors.WRONG_PW));
            }

            const plainPw = req.body.newPassword;
            const salt = await bcrypt.genSalt(10);

            user.password = await bcrypt.hash(plainPw, salt);
            await user.save();

            logger.debug("User " + user.callsign + " changed password");

            res.sendStatus(OK);
        } catch (err) {
            logger.error("Error in user change pw");
            logger.error(err);
            return res.status(INTERNAL_SERVER_ERROR).json(createError());
        }
    }
);

export default router;
