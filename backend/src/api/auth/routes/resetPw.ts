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
    .withMessage(Errors.INVALID_PW),
  validate,
  async (req, res) => {
    try {
      const user = await User.findOne({
        _id: req.body.user,
      });
      if (!user) {
        logger.debug(`User ${req.body._id} not found in reset pw`);
        return res.status(BAD_REQUEST).json(createError(Errors.USER_NOT_FOUND));
      } else if (!user.passwordResetCode) {
        logger.debug("User password reset code undefined for reset pw");
        return res
          .status(BAD_REQUEST)
          .json(createError(Errors.VERIFICATION_CODE_NOT_FOUND));
      }

      const same = bcrypt.compareSync(
        req.body.passwordResetCode,
        user.passwordResetCode,
      );

      if (same) {
        logger.debug("Password reset code match");
        user.passwordResetCode = undefined;
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
