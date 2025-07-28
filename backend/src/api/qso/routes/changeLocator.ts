import { Request, Response, Router } from "express";
import { body, param } from "express-validator";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, OK } from "http-status";
import { logger } from "../../../shared";
import { User } from "../../auth/models";
import { Errors } from "../../errors";
import Event from "../../event/models";
import { createError, validate } from "../../helpers";
import { location } from "../../location";
import { getEventDate } from "../../utils/eventDate";
import { Qso } from "../models";

const router = Router();

/**
 * @openapi
 * /api/qso/changelocator/{id}:
 *  put:
 *    summary: Updates locator for all QSOs in event
 *    parameters:
 *      - in: query
 *        name: id
 *        schema:
 *          type: string
 *          format: ObjectId
 *        description: ObjectId of the event
 *        required: true
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              locator:
 *                type: string
 *                description: New locator
 *            required:
 *              - locator
 *    tags:
 *      - qso
 *    responses:
 *      '200':
 *        description: Locator updated
 *      '400':
 *        description: Data validation failed or not join request
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
router.put(
  "/changelocator/:_id",
  param("_id").isMongoId().withMessage(Errors.INVALID_OBJECT_ID),
  body("locator")
    .isString()
    .isLength({ min: 6, max: 6 })
    .withMessage(Errors.INVALID_LOCATION),
  validate,
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error("No req.user in QSO create");
    }
    try {
      const user = await User.findOne({
        _id: req.user._id,
      });
      if (!user) {
        throw new Error("User not found in change locator");
      }

      // no longer required
      // if (!user.isAdmin) {
      //     const joinRequest = await JoinRequest.findOne({
      //         isApproved: true,
      //         fromUser: user._id,
      //         forEvent: req.params._id
      //     });
      //     if (!joinRequest) {
      //         return res
      //             .status(BAD_REQUEST)
      //             .json(createError(Errors.JOIN_REQUEST_NOT_FOUND));
      //     } else if (!joinRequest.isApproved) {
      //         return res
      //             .status(BAD_REQUEST)
      //             .json(createError(Errors.JOIN_REQUEST_NOT_APPROVED));
      //     }
      // }

      const event = await Event.findOne({
        _id: req.params._id,
        ...getEventDate(user),
      });

      if (!event) {
        return res
          .status(BAD_REQUEST)
          .json(createError(Errors.EVENT_NOT_FOUND));
      }

      const newLocation = location.calculateLatLon(req.body.locator);

      if (!newLocation) {
        return res
          .status(BAD_REQUEST)
          .json(createError(Errors.INVALID_LOCATOR));
      }

      const geocoded = await location.reverseGeocode(...newLocation);
      if (!geocoded) {
        return res
          .status(BAD_REQUEST)
          .json(createError(Errors.INVALID_LOCATION));
      }

      const { city, province } = location.parseData(geocoded);

      await Qso.updateMany(
        {
          fromStation: user._id,
          event: event._id,
        },
        {
          locator: req.body.locator,
          fromStationLat: newLocation[0],
          fromStationLon: newLocation[1],
          fromStationCity: city,
          fromStationProvince: province,
        },
      );

      res.sendStatus(OK);
    } catch (err) {
      logger.error("Error while changing locator");
      logger.error(err);
      res.status(INTERNAL_SERVER_ERROR).json(createError());
    }
  },
);

export default router;
