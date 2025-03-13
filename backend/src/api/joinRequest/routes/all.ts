import { Request, Response, Router } from "express";
import { INTERNAL_SERVER_ERROR } from "http-status";
import { logger } from "../../../shared";
import type { UserDoc } from "../../auth/models";
import { createError } from "../../helpers";
import JoinRequest from "../models";

const router = Router();

/**
 * @openapi
 * /api/joinrequest:
 *  get:
 *    summary: Gets all joinRequests for logged in user
 *    tags:
 *      - joinrequest
 *    responses:
 *      '200':
 *        description: joinRequests
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/JoinRequest'
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
router.get("/", async (req: Request, res: Response) => {
    if (!req.user) {
        throw new Error("No req.user in joinRequest get all");
    }
    try {
        const joinRequests = await JoinRequest.find(
            { fromUser: (req.user as unknown as UserDoc)._id },
            { fromUser: 0 }
        );
        res.json(joinRequests);
    } catch (err) {
        logger.error("Error while finding all joinRequests");
        logger.error(err);
        res.status(INTERNAL_SERVER_ERROR).json(createError());
    }
});

export default router;
