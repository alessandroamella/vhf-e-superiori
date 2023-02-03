import { Request, Response, Router } from "express";
import { checkSchema } from "express-validator";
import { createError, validate } from "../../helpers";
import { logger } from "../../../shared";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "http-status";
import updateSchema from "../schemas/updateSchema";
import User, { UserDoc } from "../models";
import { Errors } from "../../errors";

const router = Router();

/**
 * @openapi
 * /auth:
 *  put:
 *    summary: Updates currently logged in user
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
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ResErr'
 */
router.put(
    "/",
    checkSchema(updateSchema),
    validate,
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new Error("No req.user in user update");
        }
        try {
            // DEBUG email conferma
            const { name, email, phoneNumber } = req.body;
            if (email) {
                const emailExists = await User.exists({
                    email,
                    callsign: { $ne: (req.user as unknown as UserDoc).callsign }
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
                    callsign: { $ne: (req.user as unknown as UserDoc).callsign }
                });
                if (phoneNumberExists) {
                    return res
                        .status(BAD_REQUEST)
                        .json(createError(Errors.PHONE_NUMBER_ALREADY_IN_USE));
                }
            }
            const user = await User.findOneAndUpdate(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                { _id: (req.user as any)._id },
                { name, email },
                {
                    new: true,
                    projection: {
                        password: 0,
                        joinRequests: 0,
                        verificationCode: 0,
                        __v: 0
                    }
                }
            );
            res.json(user?.toObject());
        } catch (err) {
            logger.error("Error while updating user");
            logger.error(err);
            res.status(INTERNAL_SERVER_ERROR).json(createError());
        }
    }
);

export default router;
