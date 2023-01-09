import { Request, Response, Router } from "express";
import { checkSchema } from "express-validator";
import { createError, validate } from "../../helpers";
import { logger } from "../../../shared";
import { INTERNAL_SERVER_ERROR } from "http-status";
import updateSchema from "../schemas/updateSchema";
import User from "../models";

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
            const { name, email } = req.body;
            const user = await User.findOneAndUpdate(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                { _id: (req.user as any)._id },
                { name, email },
                {
                    new: true,
                    projection: { password: 0, joinRequests: 0, __v: 0 }
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
