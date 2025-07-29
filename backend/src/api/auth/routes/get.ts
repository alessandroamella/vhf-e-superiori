import { Router } from "express";
import { param } from "express-validator";
import { isValidObjectId } from "mongoose";
import { validate } from "../../helpers";
import returnUserWithPosts from "../../middlewares/returnUserWithPosts";

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
    return isValidObjectId(callsign)
      ? returnUserWithPosts(req, res, next, undefined, callsign)
      : returnUserWithPosts(req, res, next, callsign);
  },
);

export default router;
