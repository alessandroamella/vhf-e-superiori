/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from "express";

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
        throw new Error("No req.user in user view");
    }
    const copy = { ...req.user };
    (copy as any).password = undefined;
    (copy as any).joinRequests = undefined;
    res.json(copy);
});

export default router;
