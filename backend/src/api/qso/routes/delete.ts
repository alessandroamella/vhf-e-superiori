import { Request, Response, Router } from "express";
import { createError, validate } from "../../helpers";
import { logger } from "../../../shared";
import {
    BAD_REQUEST,
    INTERNAL_SERVER_ERROR,
    OK,
    UNAUTHORIZED
} from "http-status";
import { param } from "express-validator";
import { Errors } from "../../errors";
import User, { UserDoc } from "../../auth/models";
import { Qso } from "../models";

const router = Router();

/**
 * @openapi
 * /api/qso/{id}:
 *  delete:
 *    summary: Deletes an existing QSO
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *          format: ObjectId
 *        required: true
 *        description: ObjectId of the QSO to delete
 *    tags:
 *      - qso
 *    responses:
 *      '200':
 *        description: QSO deleted successfully
 *      '400':
 *        description: QSO not found, not owned or over deadline
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
router.delete(
    "/:_id",
    param("_id").isMongoId(),
    validate,
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new Error("No req.user in QSO delete");
        }
        try {
            const user = await User.findOne({
                _id: (req.user as unknown as UserDoc)._id
            });
            if (!user) {
                throw new Error("Can't find user in QSO delete");
            }

            const qso = await Qso.findOne({ _id: req.params._id });
            if (!qso) {
                return res
                    .status(BAD_REQUEST)
                    .json(createError(Errors.QSO_NOT_FOUND));
            } else if (
                qso.fromStation.toString() !== user._id.toString() &&
                !user.isAdmin
            ) {
                return res
                    .status(UNAUTHORIZED)
                    .json(createError(Errors.QSO_NOT_OWNED));
            }

            await qso.deleteOne();
            res.sendStatus(OK);
        } catch (err) {
            logger.error("Error while deleting QSO");
            logger.error(err);
            res.status(INTERNAL_SERVER_ERROR).json(createError());
        }
    }
);

export default router;
