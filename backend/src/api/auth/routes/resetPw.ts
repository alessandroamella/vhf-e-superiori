import bcrypt from "bcrypt";
import { Router } from "express";
import { body } from "express-validator";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, OK } from "http-status";
import { logger } from "../../../shared/logger";
import { Errors } from "../../errors";
import { createError, validate } from "../../helpers";
import { User } from "../models";

const router = Router();

/**
 * @openapi
 * /api/auth/resetpw:
 *  post:
 *    summary: Resets password
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              user:
 *                type: string
 *                description: ObjectId of the user
 *              passwordResetCode:
 *                type: string
 *                description: New password
 *              newPassword:
 *                type: string
 *                description: New password
 *            required:
 *              - user
 *              - passwordResetCode
 *              - newPassword
 *    tags:
 *      - auth
 *    responses:
 *      '200':
 *        description: Password reset successful
 *      '400':
 *        description: Invalid params
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
  body("user").isString().trim().isMongoId(),
  body("passwordResetCode").isString().trim().notEmpty(),
  body("newPassword")
    .isString()
    .trim()
    .isStrongPassword({ minLength: 8, minSymbols: 0 })
    .withMessage(Errors.WEAK_PW), // Assuming WEAK_PW is your error for this
  validate,
  async (req, res) => {
    try {
      const user = await User.findOne({
        _id: req.body.user,
        "passwordReset.expires": { $gt: new Date() },
      });

      // This check now handles invalid user ID, no token, or expired token
      if (!user || !user.passwordReset) {
        logger.debug(
          `User ${req.body.user} not found or token expired in reset pw`,
        );
        return res
          .status(BAD_REQUEST)
          .json(createError(Errors.INVALID_PW_RESET_CODE));
      }

      // Compare the code from the nested object
      const same = await bcrypt.compare(
        req.body.passwordResetCode,
        user.passwordReset.code,
      );

      if (same) {
        logger.debug("Password reset code match");

        // Clear the entire passwordReset object to invalidate the token
        user.passwordReset = undefined;

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.newPassword, salt);
        await user.save();
        return res.sendStatus(OK);
      } else {
        logger.debug("Password reset code fail");
        return res
          .status(BAD_REQUEST)
          .json(createError(Errors.INVALID_PW_RESET_CODE));
      }
    } catch (err) {
      logger.error("Error in user reset pw");
      logger.error(err);
      return res.status(INTERNAL_SERVER_ERROR).json(createError());
    }
  },
);

export default router;
