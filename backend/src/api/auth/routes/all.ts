import { Router } from "express";
import { logger } from "../../../shared/logger";
import { query } from "express-validator";
import { createError, validate } from "../../helpers";
import User from "../models";
import { INTERNAL_SERVER_ERROR } from "http-status";
import JoinRequest from "../../joinRequest/models";

const router = Router();

/**
 * @openapi
 * /api/auth/all:
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
 *      - in: query
 *        name: sortByCallsign
 *        schema:
 *          type: boolean
 *        description: Whether to sort by callsign instead of signup date
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
    query("sortByCallsign").optional().isBoolean().toBoolean(),
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
            if (req.query.sortByCallsign && req.query.sortByCallsign === "true")
                users.sort({ callsign: 1 });
            else users.sort({ createdAt: -1 });

            const result = await users.exec();

            const joinRequests = await JoinRequest.find({
                fromUser: { $in: result.map(u => u._id) }
            })
                .populate({
                    path: "fromUser",
                    select: "callsign name email phoneNumber"
                })
                .populate({ path: "forEvent", select: "name" })
                .sort({ createdAt: -1 });

            return res.json(
                result.map(u => {
                    const _joinRequests = joinRequests.filter(
                        jr => jr.fromUser._id.toString() === u._id.toString()
                    );
                    return {
                        ...u.toJSON(),
                        joinRequests: _joinRequests
                    };
                })
            );
        } catch (err) {
            logger.error("Error in users all");
            logger.error(err);
            return res.status(INTERNAL_SERVER_ERROR).json(createError());
        }
    }
);

export default router;
