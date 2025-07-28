import bcrypt from "bcrypt";
import { Router } from "express";
import { body } from "express-validator";
import { INTERNAL_SERVER_ERROR, OK } from "http-status";
import randomstring from "randomstring";
import { logger } from "../../../shared/logger";
import EmailService from "../../email";
import { createError, validate } from "../../helpers";
import checkCaptcha from "../../middlewares/checkCaptcha";
import { User } from "../models";

const router = Router();

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
 *                format: password
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
        return res.sendStatus(OK);
      }

      const passwordResetCode = randomstring.generate({
        length: 12,
        charset: "alphanumeric",
      });

      user.passwordResetCode = await bcrypt.hash(passwordResetCode, 10);
      await user.save();

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
