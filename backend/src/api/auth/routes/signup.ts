import { Request, Response, Router } from "express";
import { OK } from "http-status";
import passport from "passport";
import { checkSchema } from "express-validator";
import createSchema from "../schemas/createSchema";
import { validate } from "../../helpers";
import User, { UserDoc } from "../../user/models";

const router = Router();

/**
 * @openapi
 * /auth/signup:
 *  post:
 *    summary: Creates a new account
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              callsign:
 *                type: string
 *                minLength: 1
 *                maxLength: 10
 *              name:
 *                type: string
 *                minLength: 1
 *                maxLength: 50
 *              password:
 *                type: string
 *                minLength: 8
 *                maxLength: 64
 *                format: password
 *              email:
 *                type: string
 *                format: email
 *            required:
 *              - callsign
 *              - name
 *              - password
 *              - email
 *    tags:
 *      - auth
 *    responses:
 *      '200':
 *        description: Signed up successfully
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/User'
 *      '400':
 *        description: Data validation failed
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
router.post(
    "/",
    checkSchema(createSchema),
    validate,
    passport.authenticate("signup", { session: false }),
    async (req: Request, res: Response) => {
        console.log(req.user);
        res.json(
            await User.findOne(
                { _id: (req.user as UserDoc)._id },
                { _id: 0, password: 0 }
            )
        );
    }
);

export default router;
