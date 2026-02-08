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

// Track deletion state to prevent concurrent executions
let isDeletionInProgress = false;
let lastDeletionTime: number | null = null;
const MIN_TIME_BETWEEN_DELETIONS_MS = 30 * 60 * 1000; // 30 minutes

async function deleteAllContacts() {
  // Prevent concurrent executions
  if (isDeletionInProgress) {
    logger.warn("Deletion already in progress, skipping this execution");
    return;
  }

  // Check if enough time has passed since last deletion
  if (lastDeletionTime) {
    const timeSinceLastDeletion = Date.now() - lastDeletionTime;
    if (timeSinceLastDeletion < MIN_TIME_BETWEEN_DELETIONS_MS) {
      logger.info(
        `Last deletion was ${Math.round(timeSinceLastDeletion / 60000)} minutes ago. Skipping (minimum ${MIN_TIME_BETWEEN_DELETIONS_MS / 60000} minutes required)`,
      );
      return;
    }
  }

  isDeletionInProgress = true;
  logger.info("Starting deleteAllContacts process");

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
    lastDeletionTime = Date.now();
  } catch (err) {
    const error = (err as Error)?.message || err;
    logger.error(
      `Error in deleteAllContacts: ${typeof error === "object" ? JSON.stringify(error) : error}`,
    );
  } finally {
    isDeletionInProgress = false;
  }
}

async function checkContactsAndDeleteIfNeeded() {
  try {
    // Don't check if deletion is already in progress
    if (isDeletionInProgress) {
      logger.info("Deletion in progress, skipping hourly contact count check");
      return;
    }

    logger.info("Running hourly contact count check");

    // Get contact count with limit 510 to be safe
    const listResponse = await mailjet
      .get("contact")
      .request(undefined, { Limit: 510 });

    const { Count: totalCount, Data: contacts } = listResponse.body as {
      Count: number;
      Data: ContactData[];
    };

    logger.info(
      `Current contact count: ${contacts.length} (Total: ${totalCount})`,
    );

    if (contacts.length > 500) {
      logger.warn(
        `Contact count (${contacts.length}) exceeds 500 threshold. Triggering deletion process.`,
      );
      await deleteAllContacts();
    } else {
      logger.info(`Contact count is within limits (${contacts.length}/500)`);
    }
  } catch (err) {
    const error = (err as Error)?.message || err;
    logger.error(
      `Error in checkContactsAndDeleteIfNeeded: ${typeof error === "object" ? JSON.stringify(error) : error}`,
    );
  }
}

export function scheduleHourlyContactCheck() {
  const job = new CronJob("0 * * * *", checkContactsAndDeleteIfNeeded); // Every hour at minute 0
  job.start();
  logger.info("Hourly MailJet contact check cron job scheduled");
}

export function scheduleWeeklyContactDeletion() {
  const job = new CronJob("0 0 * * 5", deleteAllContacts); // Every Friday at midnight
  job.start();
  logger.info("Weekly MailJet contact deletion cron job scheduled");
}
