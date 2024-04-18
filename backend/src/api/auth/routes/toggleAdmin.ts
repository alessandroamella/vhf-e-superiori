import { Request, Response, Router } from "express";
import { body, param } from "express-validator";
import { createError, validate } from "../../helpers";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "http-status";
import { User, UserDoc } from "../models";
import { Errors } from "../../errors";
import { logger } from "../../../shared";
import EmailService from "../../../email";

const router = Router();

/**
 * @openapi
 * /api/auth/admin/{id}:
 *  put:
 *    summary: Toggles admin status of a user
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              isAdmin:
 *                type: boolean
 *            required:
 *              - isAdmin
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
 *        description: Not logged in or not an admin
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
    "/admin/:_id",
    body("isAdmin").isBoolean().toBoolean(),
    param("_id").isMongoId(),
    validate,
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new Error("No req.user in user update");
        }
        const reqUser = await User.findOne({
            _id: (req.user as unknown as UserDoc)._id
        });
        if (!reqUser) {
            throw new Error("req.user not found in toggleAdmin");
        }
        const { isAdmin } = req.body;

        try {
            const user = await User.findOne({
                _id: req.params._id
            });
            if (!user) {
                return res
                    .sendStatus(BAD_REQUEST)
                    .json(createError(Errors.USER_NOT_FOUND));
            } else if (user.isAdmin && !isAdmin && !reqUser.isDev) {
                return res
                    .sendStatus(BAD_REQUEST)
                    .json(createError(Errors.MUST_BE_DEV));
            }

            user.isAdmin = isAdmin;
            await user.save();

            if (isAdmin) {
                logger.info(`User ${user.callsign} is now an admin`);
                await EmailService.sendNewAdminMail(user);
            } else {
                logger.info(`User ${user.callsign} is no longer an admin`);
            }

            return res.json(user);
        } catch (err) {
            logger.error("Error in user update");
            logger.error(err);
            return res.status(INTERNAL_SERVER_ERROR).json(createError());
        }
    }
);

export default router;
