import path from "node:path";
import { Router } from "express";

const router = Router();

/**
 * @openapi
 * /api/document/tos:
 *  get:
 *    summary: Gets the Terms and Conditions in Markdown format
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
router.get("/", (_req, res) => {
  res.sendFile("tos.md", { root: path.join(process.cwd(), "documents") });
});

export default router;
