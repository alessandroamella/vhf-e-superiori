import axios from "axios";
import { CronJob } from "cron";
import { envs, logger } from "../../shared";
import { wait } from "../utils/wait";
import { mailjet } from "./client";

interface ContactData {
  IsExcludedFromCampaigns: boolean;
  Name: string;
  CreatedAt: string;
  DeliveredCount: number;
  Email: string;
  ExclusionFromCampaignsUpdatedAt: string;
  ID: number;
  IsOptInPending: boolean;
  IsSpamComplaining: boolean;
  LastActivityAt: string;
  LastUpdateAt: string;
  UnsubscribedAt: string;
  UnsubscribedBy: string;
}

async function deleteAllContacts() {
  try {
    // Create axios instance with Basic auth for HTTP API
    const axiosInstance = axios.create({
      baseURL: "https://api.mailjet.com",
      auth: {
        username: envs.MAIL_USERNAME,
        password: envs.MAIL_PASSWORD,
      },
    });

    // 1. Retrieve all contacts at once (1000 max)
    const listResponse = await mailjet
      .get("contact")
      .request(undefined, { Limit: 1000 });

    const { Data: allContacts } = listResponse.body as {
      Count: number;
      Data: ContactData[];
    };

    if (allContacts.length === 0) {
      logger.info("No contacts found to delete");
      return;
    }

    logger.info(
      `Retrieved ${allContacts.length} contacts total. Starting deletion in batches...`,
    );

    // 2. Delete contacts in batches of 100 with 10-second delays
    const deleteBatchSize = 100;
    const delayMs = 10000; // 10 seconds

    for (let i = 0; i < allContacts.length; i += deleteBatchSize) {
      const batch = allContacts.slice(i, i + deleteBatchSize);
      const batchNumber = Math.floor(i / deleteBatchSize) + 1;

      logger.info(
        `Processing delete batch ${batchNumber}: ${batch.length} contacts`,
      );

      for (const contact of batch) {
        try {
          // DELETE /v4/contacts/{contact_ID}
          await axiosInstance.delete(`/v4/contacts/${contact.ID}`);

          logger.info(
            `Successfully deleted contact ID: ${contact.ID} (email: ${contact.Email})`,
          );
        } catch (err) {
          const error = (err as Error)?.message || err;
          logger.error(
            `Failed to delete contact ${contact.ID}: ${
              typeof error === "object" ? JSON.stringify(error) : error
            }`,
          );
        }
      }

      // Wait 10 seconds before next batch (except after the last batch)
      if (i + deleteBatchSize < allContacts.length) {
        logger.info(`Waiting 10 seconds before next delete batch...`);
        await wait(delayMs);
      }
    }

    logger.info("Finished deletion process");
  } catch (err) {
    const error = (err as Error)?.message || err;
    logger.error(
      `Error in deleteAllContacts: ${typeof error === "object" ? JSON.stringify(error) : error}`,
    );
  }
}

export function scheduleWeeklyContactDeletion() {
  const job = new CronJob("0 0 * * 5", deleteAllContacts); // Every Friday at midnight
  job.start();
  logger.info("Weekly MailJet contact deletion cron job scheduled");
}
