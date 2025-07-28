import { Request, Response, Router } from "express";
import { param } from "express-validator";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "http-status";
import { logger } from "../../../shared";
import type { UserDoc } from "../../auth/models";
import { Errors } from "../../errors";
import { createError, validate } from "../../helpers";
import JoinRequest from "../models";

const router = Router();

/**
 * @openapi
 * /api/joinrequest/event/{id}:
 *  get:
 *    summary: Gets a joinRequest for a specific event (for a logged in user)
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
 *        description: joinRequest
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/JoinRequest'
 *      '400':
 *        description: Invalid ObjectId or joinRequest not found
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
router.get(
  "/:_id",
  param("_id").isMongoId(),
  validate,
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error("No req.user in joinRequest get event");
    }
    try {
      const joinRequest = await JoinRequest.findOne(
        {
          forEvent: req.params._id,
          fromUser: (req.user as unknown as UserDoc)._id,
        },
        { fromUser: 0 },
      );
      if (!joinRequest) {
        return res
          .status(BAD_REQUEST)
          .json(createError(Errors.JOIN_REQUEST_NOT_FOUND));
      }
      res.json(joinRequest);
    } catch (err) {
      logger.error("Error while finding joinRequests for event");
      logger.error(err);
      res.status(INTERNAL_SERVER_ERROR).json(createError());
    }
  },
);

export default router;
