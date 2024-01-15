import { Request, Response, Router } from "express";
import { createError, validate } from "../../helpers";
import { logger } from "../../../shared";
import { INTERNAL_SERVER_ERROR } from "http-status";
import JoinRequest from "../models";
import { param } from "express-validator";

const router = Router();

/**
 * @openapi
 * /joinrequest/eventadmin/{id}:
 *  get:
 *    summary: Gets all joinRequests for a specific event, user must be admin
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *          format: ObjectId
 *        required: true
 *        description: ObjectId of the event
 *    tags:
 *      - joinrequest
 *    responses:
 *      '200':
 *        description: joinRequests with populated fromUser
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/JoinRequest'
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
    "/:id",
    param("id").isMongoId(),
    validate,
    async (req: Request, res: Response) => {
        try {
            const joinRequests = await JoinRequest.find({
                forEvent: req.params.id
            })
                .populate({ path: "fromUser", select: "callsign" })
                .sort({ createdAt: -1 });
            res.json(joinRequests);
        } catch (err) {
            logger.error("Error while finding joinRequests for eventAdmin");
            logger.error(err);
            res.status(INTERNAL_SERVER_ERROR).json(createError());
        }
    }
);

export default router;
