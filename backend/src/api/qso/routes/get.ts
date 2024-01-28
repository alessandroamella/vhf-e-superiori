import { Router } from "express";
import { logger } from "../../../shared/logger";
import { param, query } from "express-validator";
import { createError, validate } from "../../helpers";
import { Qso } from "../models";
import { INTERNAL_SERVER_ERROR } from "http-status";
import { FilterQuery } from "mongoose";
import { QsoClass } from "../models/Qso";

const router = Router();

/**
 * @openapi
 * /qso/{id}:
 *  get:
 *    summary: Get a QSO by ID
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *          format: ObjectId
 *        required: true
 *        description: ObjectId of the QSO to get
 *    tags:
 *      - qso
 *    responses:
 *      '200':
 *        description: QSO
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Qso'
 *      '400':
 *        description: QSO not found
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
router.get("/_id", param("_id").isMongoId(), validate, async (req, res) => {
    try {
        const qso = await Qso.findById(req.params._id, {
            emailSentDate: 0,
            emailSent: 0
        }).lean();
        res.json(qso);
    } catch (err) {
        logger.error("Error in QSO get");
        logger.error(err);
        return res.status(INTERNAL_SERVER_ERROR).json(createError());
    }
});

export default router;
