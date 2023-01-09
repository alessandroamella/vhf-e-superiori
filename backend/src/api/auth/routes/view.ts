/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from "express";
import { Errors } from "../../errors";
import { createError } from "../../helpers";
import { UNAUTHORIZED } from "http-status";

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
router.get("/", (req, res) => {
    if (!req.user) {
        return res.status(UNAUTHORIZED).json(createError(Errors.NOT_LOGGED_IN));
    }
    const copy = { ...req.user };
    (copy as any).password = undefined;
    (copy as any).joinRequests = undefined;
    res.json(copy);
});

export default router;
