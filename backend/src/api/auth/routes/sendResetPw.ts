import bcrypt from "bcrypt";
import { Router } from "express";
import { body } from "express-validator";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, OK } from "http-status";
import moment from "moment";
import randomstring from "randomstring";
import { logger } from "../../../shared/logger";
import EmailService from "../../email";
import { Errors } from "../../errors";
import { createError, validate } from "../../helpers";
import checkCaptcha from "../../middlewares/checkCaptcha";
import { User } from "../models";

const router = Router();

const PW_RESET_EXPIRATION_MINUTES = 15;

/**
 * @openapi
 * /api/auth/sendresetpw:
 *  post:
 *    summary: Sends reset password email
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              email:
 *                type: string
 *                format: email
 *              token:
 *                type: string
 *                description: ReCAPTCHA token
 *            required:
 *              - email
 *              - token
 *    tags:
 *      - auth
 *    responses:
 *      '200':
 *        description: Password reset email sent if email exists
 *      '401':
 *        description: Invalid token or user not verified
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
  body("email").isString().trim().isEmail(),
  body("token").isString().notEmpty(),
  validate,
  checkCaptcha,
  async (req, res) => {
    try {
      const user = await User.findOne({
        email: req.body.email,
      });
      if (!user) {
        logger.debug(`Email ${req.body.email} not found in send reset pw`);
        // Always return OK to prevent email enumeration attacks
        return res.sendStatus(OK);
      }

      // check if another code was sent within last minute
      if (
        user.passwordReset &&
        moment(user.passwordReset.expires)
          .subtract(PW_RESET_EXPIRATION_MINUTES - 1, "minutes")
          .isAfter(new Date())
      ) {
        logger.debug(
          `Password reset already requested recently for user ${user.callsign}`,
        );
        return res
          .status(BAD_REQUEST)
          .json(createError(Errors.PW_RESET_WAIT_BEFORE_NEW));
      }

      const passwordResetCode = randomstring.generate({
        length: 12,
        charset: "alphanumeric",
      });

      const hashedCode = await bcrypt.hash(passwordResetCode, 10);
      const expires = moment()
        .add(PW_RESET_EXPIRATION_MINUTES, "minutes")
        .toDate();

      // Create and assign the new PasswordReset object
      user.passwordReset = {
        code: hashedCode,
        expires: expires,
      };
      await user.save();

      // Send the UN-HASHED code to the user
      await EmailService.sendResetPwMail(user, passwordResetCode);

      logger.debug(`User ${user.callsign} sent reset pw request`);

      res.sendStatus(OK);
    } catch (err) {
      logger.error("Error in user reset pw");
      logger.error(err);
      return res.status(INTERNAL_SERVER_ERROR).json(createError());
    }
  },
);

export default router;
