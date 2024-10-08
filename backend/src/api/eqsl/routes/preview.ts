import { Request, Response, Router } from "express";
import { body } from "express-validator";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "http-status";
import { logger } from "../../../shared/logger";
import { Errors } from "../../errors";
import { createError, validate } from "../../helpers";
import EqslPic from "../eqsl";
import { User, UserDoc } from "../../auth/models";
import isLoggedIn from "../../middlewares/isLoggedIn";
import { Qso } from "../../qso/models";
import isAdmin from "../../middlewares/isAdmin";
import Event from "../../event/models";

const router = Router();

/**
 * @openapi
 * /api/eqsl/preview:
 *  post:
 *    summary: (Forcibly) create a new eQSL image, will use boilerplate data on top of href image
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              href:
 *                type: string
 *                format: uri
 *              offsetCallsign:
 *                type: number
 *              offsetData:
 *                type: number
 *              offsetFrom:
 *                type: number
 *            required:
 *              - href
 *    tags:
 *      - eqsl
 *    responses:
 *      '200':
 *        description: Image of the created eQSL
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                href:
 *                  type: string
 *                  format: uri
 *      '401':
 *        description: Not an admin
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
    isLoggedIn,
    isAdmin,
    body("href").isURL(),
    body("offsetCallsign").isInt().optional(),
    body("offsetData").isInt().optional(),
    body("offsetFrom").isInt().optional(),
    validate,
    async (req: Request, res: Response) => {
        try {
            if (!req.user) {
                throw new Error("No req.user in user change pw");
            }

            const user = await User.findOne({
                _id: (req.user as unknown as UserDoc)._id
            });
            if (!user) {
                throw new Error("User not found in eqsl create");
            }

            if (!user.city || !user.province) {
                logger.debug("User has no city or province");
                return res
                    .status(BAD_REQUEST)
                    .json(createError(Errors.INVALID_LOCATION));
            }

            const qso = new Qso({
                // test data
                callsign: "IU4QSG",
                qsoDate: new Date(),
                frequency: 123.123,
                emailSent: false,
                fromStation: user,
                mode: "SSB",
                event: "60b3e3e3e4b0e3e3e4b0e3e3", // test data, it doesn't matter
                fromStationCity: user.city || "Bologna",
                fromStationProvince: user.province || "BO",
                fromStationLat: user.lat || 44.4949,
                fromStationLon: user.lon || 11.3426,
                imageHref: req.body.href,
                band: "23cm"
            });
            const eqslPic = new EqslPic(req.body.href);

            const testEvent = new Event({
                offsetCallsign: req.body.offsetCallsign,
                offsetData: req.body.offsetData,
                offsetFrom: req.body.offsetFrom
            });

            await eqslPic.fetchImage();
            await eqslPic.addQsoInfo(qso, user, null, testEvent);
            const href = await eqslPic.uploadImage(
                (req.user as unknown as UserDoc)._id.toString(),
                false,
                true
            );

            res.status(200).json({ href });
        } catch (err) {
            logger.error("Error creating eQSL in eQSL preview");
            logger.error(err);
            res.status(INTERNAL_SERVER_ERROR).json(
                createError(Errors.ERROR_CREATING_IMAGE)
            );
        }
    }
);

export default router;
