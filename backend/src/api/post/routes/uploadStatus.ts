import { Request, Response, Router } from "express";
import { validate } from "../../helpers";
import { body } from "express-validator";
import { getUploadStatus } from "./upload";

const router = Router();

/**
 * @openapi
 * /post/uploadstatus:
 *  post:
 *    summary: File upload status
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              md5s:
 *                type: array
 *                minItems: 0
 *                maxItems: 7
 *                items:
 *                  type: string
 *                description: Paths of the files to check
 *            required:
 *              - md5s
 *    tags:
 *      - post
 *    responses:
 *      '200':
 *        description: File upload status
 *        application/json:
 *          schema:
 *            type: array
 *            items:
 *              type: object
 *              properties:
 *                md5:
 *                  type: string
 *                percent:
 *                  type: number
 *              required:
 *                - md5
 *                - percent
 *      '400':
 *        description: File not found or invalid params
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ResErr'
 *      '401':
 *        description: Not logged in or not verified
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
    body("md5s").isArray({ min: 0, max: 7 }),
    body("md5s.*").isString().notEmpty({ ignore_whitespace: true }),
    validate,
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new Error("No req.user in post file upload status");
        }

        const arr: { md5: string; percent: number }[] = [];
        for (const md5 of req.body.md5s as string[]) {
            const status = getUploadStatus(md5);
            if (status) {
                arr.push({ md5, percent: status.percent });
            }
        }

        return res.json(arr);
    }
);

export default router;
