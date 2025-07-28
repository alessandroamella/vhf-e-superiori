import bcrypt from "bcrypt";
import { NextFunction, Request, Response, Router } from "express";
import { body, checkSchema, param } from "express-validator";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, UNAUTHORIZED } from "http-status";
import randomstring from "randomstring";
import { logger } from "../../../shared";
import EmailService from "../../email";
import { Errors } from "../../errors";
import { createError, validate } from "../../helpers";
import returnUserWithPosts from "../../middlewares/returnUserWithPosts";
import { User, UserDoc } from "../models";
import updateSchema from "../schemas/updateSchema";

const router = Router();

/**
 * @openapi
 * /api/auth/{id}:
 *  put:
 *    summary: Updates user
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *          format: ObjectId
 *        required: true
 *        description: ObjectId of the user to update (must be the same as the logged in user's _id if not admin)
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              name:
 *                type: string
 *                minLength: 1
 *                maxLength: 50
 *              email:
 *                type: string
 *                format: email
 *    tags:
 *      - auth
 *    responses:
 *      '200':
 *        description: User updated successfully
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
 *      '401':
 *        description: Not logged in
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ResErr'
 *      '500':
 *        description: Server error
 *        content:
 *          appliwcation/json:
 *            schema:
 *              $ref: '#/components/schemas/ResErr'
 */
router.put(
  "/:_id",
  param("_id").isMongoId(),
  checkSchema(updateSchema),
  body("isAdmin").optional().isBoolean().toBoolean(),
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    const curUser = req.user;
    if (!curUser) {
      throw new Error("No req.user in user update");
    }
    const user = await User.findOne({
      _id: req.params._id,
    });

    if (!user) {
      return res.status(BAD_REQUEST).json(createError(Errors.USER_NOT_FOUND));
    }

    // if user is not admin, check _id is the same as the user's _id
    if (curUser._id.toString() !== req.params._id && !curUser.isAdmin) {
      logger.debug(
        `User ${curUser.callsign} tried to update user ${user.callsign} without admin privileges`,
      );

      return res.status(UNAUTHORIZED).json(createError(Errors.NOT_AN_ADMIN));
    }

    try {
      // DEBUG email conferma
      const {
        callsign,
        name,
        email,
        phoneNumber,
        address,
        lat,
        lon,
        city,
        province,
        isAdmin,
      } = req.body;

      if (email) {
        const emailExists = await User.exists({
          email,
          callsign: { $ne: user.callsign },
        });
        if (emailExists) {
          return res
            .status(BAD_REQUEST)
            .json(createError(Errors.EMAIL_ALREADY_IN_USE));
        }
      }

      if (phoneNumber) {
        const phoneNumberExists = await User.exists({
          phoneNumber,
          callsign: { $ne: user.callsign },
        });
        if (phoneNumberExists) {
          return res
            .status(BAD_REQUEST)
            .json(createError(Errors.PHONE_NUMBER_ALREADY_IN_USE));
        }
      }

      const oldEmail = user.email;
      const obj = {
        name,
        email,
        phoneNumber,
      } as Partial<UserDoc>;
      if (address) {
        obj.address = address;
        obj.lat = lat;
        obj.lon = lon;
        obj.city = city;
        obj.province = province;
      }

      if (curUser.isAdmin) {
        obj.callsign = callsign || user.callsign;
        obj.isAdmin = isAdmin || user.isAdmin;
      }

      const newUser = await User.findOneAndUpdate({ _id: user._id }, obj, {
        new: true,
      });
      if (!newUser) {
        throw new Error("User not found in update");
      }

      logger.debug("Updated user with data:");
      logger.debug({
        callsign,
        name,
        email,
        phoneNumber,
        address,
        lat,
        lon,
        city,
        province,
      });

      if (oldEmail !== email && !newUser.isAdmin) {
        logger.debug(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          `User ${user.callsign} update: email was "${
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            user.email
          }", now is "${email}"`,
        );
        // user was not verified, create new verification code and send new verification email
        const newVerifCode = randomstring.generate({
          length: 12,
          charset: "alphanumeric",
        });

        newUser.verificationCode = bcrypt.hashSync(newVerifCode, 10);
        newUser.isVerified = false;
        await newUser.save();

        logger.debug(
          `New verification code for ${newUser.callsign}: ${newVerifCode} (hash: ${user.verificationCode})`,
        );

        await EmailService.sendVerifyMail(newUser, newVerifCode, false);
      }

      if (curUser._id.toString() === user._id.toString()) {
        // Transform the Mongoose document to match the expected req.user type
        // biome-ignore lint/suspicious/noExplicitAny: Needed for type conversion
        const newUserLean = newUser.toObject() as any;
        req.user = {
          ...newUserLean,
          createdAt: newUserLean.createdAt.toISOString(),
          updatedAt: newUserLean.updatedAt.toISOString(),
          _id: newUserLean._id.toString(),
        } as unknown as typeof req.user;
      }

      return returnUserWithPosts(
        req,
        res,
        next,
        undefined,
        newUser._id.toString(),
      );
    } catch (err) {
      logger.error("Error while updating user");
      logger.error(err);
      return res.status(INTERNAL_SERVER_ERROR).json(createError());
    }
  },
);

export default router;
