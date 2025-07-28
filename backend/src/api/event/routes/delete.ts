import { Request, Response, Router } from "express";
import { param } from "express-validator";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, OK } from "http-status";
import { logger } from "../../../shared";
import { s3Client } from "../../aws";
import { Errors } from "../../errors";
import { createError, validate } from "../../helpers";
import JoinRequest from "../../joinRequest/models";
import { Qso } from "../../qso/models";
import EventModel from "../models";

const router = Router();

/**
 * @openapi
 * /api/event/{id}:
 *  delete:
 *    summary: Deletes an existing event and all associated data (must be admin)
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *          format: ObjectId
 *        required: true
 *        description: ObjectId of the event to delete
 *    tags:
 *      - event
 *    responses:
 *      '200':
 *        description: Event and associated data deleted successfully
 *      '400':
 *        description: Event not found
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ResErr'
 *      '401':
 *        description: Not logged in or not an admin
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
    try {
      // First, check if the event exists
      const event = await EventModel.findOne({ _id: req.params._id });
      if (!event) {
        return res
          .status(BAD_REQUEST)
          .json(createError(Errors.EVENT_NOT_FOUND));
      }

      logger.info(`Starting deletion of event ${event.name} (${event._id})`);

      // 1. Delete all join requests for this event
      const joinRequests = await JoinRequest.find({ forEvent: event._id });
      const joinRequestCount = joinRequests.length;
      await JoinRequest.deleteMany({ forEvent: event._id });
      logger.info(
        `Deleted ${joinRequestCount} join requests for event ${event._id}`,
      );

      // 2. Get all QSOs for this event to collect file paths before deletion
      const qsos = await Qso.find({ event: event._id }).lean();
      const qsoCount = qsos.length;

      // Collect file paths from QSOs (imageHref contains the full URL, we need the S3 key)
      const qsoFilePaths: string[] = [];
      for (const qso of qsos) {
        if (qso.imageHref) {
          // Extract S3 key from the full URL
          // URL format: https://bucket.s3.region.amazonaws.com/folder/filename
          const urlParts = qso.imageHref.split("/");
          if (urlParts.length >= 2) {
            const s3Key = urlParts.slice(-2).join("/"); // Get last 2 parts (folder/filename)
            qsoFilePaths.push(s3Key);
          }
        }
      }

      // 3. Delete all QSOs for this event
      await Qso.deleteMany({ event: event._id });
      logger.info(`Deleted ${qsoCount} QSOs for event ${event._id}`);

      // 4. Collect and delete event-related files from S3
      const eventFilePaths: string[] = [];

      // Add event logo if exists
      if (event.logoUrl) {
        const urlParts = event.logoUrl.split("/");
        if (urlParts.length >= 2) {
          const s3Key = urlParts.slice(-2).join("/");
          eventFilePaths.push(s3Key);
        }
      }

      // Add event eQSL template if exists
      if (event.eqslUrl) {
        const urlParts = event.eqslUrl.split("/");
        if (urlParts.length >= 2) {
          const s3Key = urlParts.slice(-2).join("/");
          eventFilePaths.push(s3Key);
        }
      }

      // Delete files from S3
      const allFilePaths = [...eventFilePaths, ...qsoFilePaths];
      if (allFilePaths.length > 0) {
        logger.info(
          `Deleting ${allFilePaths.length} files from S3: ${allFilePaths.join(", ")}`,
        );
        await s3Client.deleteMultiple({ filePaths: allFilePaths });
      }

      // 6. Finally, delete the event itself
      await EventModel.deleteOne({ _id: event._id });

      logger.info(`Successfully deleted event ${event.name} (${event._id}) and all associated data:
        - Join requests: ${joinRequestCount}
        - QSOs: ${qsoCount}
        - Files: ${allFilePaths.length}`);

      res.sendStatus(OK);
    } catch (err) {
      logger.error("Error while deleting event and associated data");
      logger.error(err);
      res.status(INTERNAL_SERVER_ERROR).json(createError());
    }
  },
);

export default router;
