import { Router } from "express";
import path from "path";

const router = Router();

/**
 * @openapi
 * /api/document/privacy:
 *  get:
 *    summary: Gets the privacy policy in markdown format
 *    tags:
 *      - document
 *    responses:
 *      '200':
 *        description: Privacy policy
 *      '500':
 *        description: Server error
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ResErr'
 */
router.get("/", (req, res) => {
    res.sendFile("privacy.md", { root: path.join(process.cwd(), "documents") });
});

export default router;
