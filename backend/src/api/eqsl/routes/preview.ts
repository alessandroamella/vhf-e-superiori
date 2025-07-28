import { Request, Response, Router } from "express";
import { body } from "express-validator";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "http-status";
import { logger } from "../../../shared/logger";
import { User, UserDoc } from "../../auth/models";
import { Errors } from "../../errors";
import Event from "../../event/models";
import { createError, validate } from "../../helpers";
import isAdmin from "../../middlewares/isAdmin";
import isLoggedIn from "../../middlewares/isLoggedIn";
import { Qso } from "../../qso/models";
import EqslPic from "../eqsl";

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
        _id: req.user._id,
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

      const testEvent = new Event({
        offsetCallsign: req.body.offsetCallsign,
        offsetData: req.body.offsetData,
        offsetFrom: req.body.offsetFrom,
      });

      const qso = new Qso({
        // test data
        callsign: user.callsign || "IU4QSGs",
        qsoDate: new Date(),
        frequency: 123.123,
        emailSent: false,
        fromStation: user,
        mode: "SSB",
        // test data, it doesn't matter
        event: testEvent._id,
        fromStationCity: user.city || "Bologna",
        fromStationProvince: user.province || "BO",
        fromStationLat: user.lat || 44.4949,
        fromStationLon: user.lon || 11.3426,
        imageHref: req.body.href,
        band: "23cm",
      });
      const eqslPic = new EqslPic(req.body.href);

      await eqslPic.fetchImage();
      await eqslPic.addQsoInfo(qso, user, null, testEvent);
      const href = await eqslPic.uploadImage(
        req.user._id.toString(),
        false,
        true,
      );

      res.status(200).json({ href });
    } catch (err) {
      logger.error("Error creating eQSL in eQSL preview");
      logger.error(err);
      res
        .status(INTERNAL_SERVER_ERROR)
        .json(createError(Errors.ERROR_CREATING_IMAGE));
    }
  },
);

export default router;
