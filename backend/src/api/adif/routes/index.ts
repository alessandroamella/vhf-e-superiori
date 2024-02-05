import { AdifParser } from "adif-parser-ts";

import { Router } from "express";
import { body } from "express-validator";
import { BAD_REQUEST } from "http-status";
import { logger } from "../../../shared/logger";
import { Errors } from "../../errors";
import { createError, validate } from "../../helpers";
import isLoggedIn from "../../middlewares/isLoggedIn";

const router = Router();

/**
 * @openapi
 * /api/adif/import:
 *  post:
 *    summary: Parse ADIF file
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              text:
 *                type: string
 *                format: adif
 *            required:
 *              - text
 *    tags:
 *      - adif
 *    responses:
 *      '200':
 *        description: Parsed ADIF
 *      '400':
 *        description: Invalid ADIF
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
router.post(
    "/import",
    body("text")
        .isString()
        .isLength({ min: 1, max: 100000 })
        .withMessage("Invalid ADIF"),
    validate,
    isLoggedIn,
    async (req, res) => {
        try {
            const parsed = AdifParser.parseAdi(req.body.text);
            console.log(parsed);
            res.json(parsed);
        } catch (err) {
            logger.error(err);
            res.status(BAD_REQUEST).json(createError(Errors.INVALID_ADIF));
        }
    }
);

export default router;
