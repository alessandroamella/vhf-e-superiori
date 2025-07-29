import { Router } from "express";
import returnUserWithPosts from "../../middlewares/returnUserWithPosts";

const router = Router();

/**
 * @openapi
 * /api/auth:
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
router.get("/", (req, res, next) => returnUserWithPosts(req, res, next));

export default router;
