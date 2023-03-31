/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from "express";
import { INTERNAL_SERVER_ERROR } from "http-status";
import { logger } from "../../../shared";
import { createError } from "../../helpers";
import User, { UserDoc } from "../models";

const router = Router();

/**
 * @openapi
 * /auth:
 *  get:
 *    summary: Returns whether user is logged in
 *    tags:
 *      - auth
 *    responses:
 *      '200':
 *        description: Logged in
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/User'
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
router.get("/", async (req, res) => {
    if (!req.user) {
        throw new Error("No req.user in user view");
    }
    try {
        const user = await User.findOne((req.user as unknown as UserDoc).id, {
            password: 0,
            joinRequests: 0,
            verificationCode: 0,
            passwordResetCode: 0,
            __v: 0
        })
            .populate("posts", ["description", "isApproved", "createdAt"])
            .lean();
        user?.posts?.reverse();
        logger.debug("User view");
        logger.debug(user);
        res.json(user);
    } catch (err) {
        logger.error("Error in user view");
        logger.error(err);
        res.status(INTERNAL_SERVER_ERROR).json(createError());
    }
});

export default router;
