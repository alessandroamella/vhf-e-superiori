import { Router } from "express";
import passport from "passport";
import { Errors } from "../../errors";
import jwt from "jsonwebtoken";
import { envs } from "../../../shared/envs";
import { AuthOptions } from "../shared";
import { logger } from "../../../shared/logger";
import { body, query } from "express-validator";
import { createError, validate } from "../../helpers";
import User from "../models";
import { INTERNAL_SERVER_ERROR } from "http-status";

const router = Router();

/**
 * @openapi
 * /auth/all:
 *  get:
 *    summary: Gets all registered users, ordered by signup date (reverse order), must be admin
 *    parameters:
 *      - in: query
 *        name: limit
 *        schema:
 *          type: integer
 *          minimum: 1
 *          maximum: 100
 *        description: Number of users to return (all users if not specified)
 *        required: false
 *    tags:
 *      - auth
 *    responses:
 *      '200':
 *        description: Users without password, verificationCode and passwordResetCode
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/User'
 *      '401':
 *        description: Not logged in or not an admin
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
router.get(
    "/",
    query("limit").optional().isInt({ min: 1 }).toInt(),
    validate,
    async (req, res) => {
        try {
            const limit = parseInt(req.query.limit as string) as number;
            const users = User.find(
                {},
                {
                    password: 0,
                    // joinRequests: 0,
                    verificationCode: 0,
                    passwordResetCode: 0,
                    __v: 0
                }
            );
            if (limit) users.limit(limit);
            res.json(await users.sort({ createdAt: -1 }).lean());
        } catch (err) {
            logger.error("Error in users all");
            logger.error(err);
            return res.status(INTERNAL_SERVER_ERROR).json(createError());
        }
    }
);

export default router;
