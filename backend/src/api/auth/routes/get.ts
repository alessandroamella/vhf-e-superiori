/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from "express";
import returnUserWithPosts from "../../middlewares/returnUserWithPosts";
import { isValidObjectId } from "mongoose";
import { param } from "express-validator";
import { validate } from "../../helpers";

const router = Router();

/**
 * @openapi
 * /api/auth/{callsign}:
 *  get:
 *    summary: Returns user data, posts and QSOs
 *    parameters:
 *      - in: path
 *        name: callsign
 *        schema:
 *          type: string
 *        required: true
 *        description: Callsign to search for
 *    tags:
 *      - auth
 *    responses:
 *      '200':
 *        description: User
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/User'
 *      '400':
 *        description: Not found
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
    "/:callsign",
    param("callsign").isString().trim().toUpperCase(),
    validate,
    (req, res, next) => {
        const { callsign } = req.params;
        if (isValidObjectId(callsign)) {
            return returnUserWithPosts(req, res, next, undefined, callsign);
        } else {
            return returnUserWithPosts(req, res, next, callsign);
        }
    }
);

export default router;
