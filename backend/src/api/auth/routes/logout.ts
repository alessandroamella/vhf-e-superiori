import { Router } from "express";
import { OK } from "http-status";
import { AuthOptions } from "../shared";

const router = Router();

/**
 * @openapi
 * /auth/logout:
 *  post:
 *    summary: Logs out
 *    tags:
 *      - auth
 *    responses:
 *      '200':
 *        description: Logged out
 */
router.post("/", async (req, res, next) => {
    res.clearCookie(AuthOptions.AUTH_COOKIE_NAME, {
        httpOnly: true,
        signed: true
    });
    res.sendStatus(OK);
});

export default router;
