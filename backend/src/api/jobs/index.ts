import { logger } from "../../shared";
import { cleanUnusedFilesJob } from "./cleanUnusedFiles";
import { sendEqslEmailJob } from "./sendEmails";

logger.debug("Starting Cron Jobs");
cleanUnusedFilesJob.start();
sendEqslEmailJob.start();
