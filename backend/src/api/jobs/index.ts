import { logger } from "../../shared";
import { cleanUnusedFilesJob } from "./cleanUnusedFiles";
import { sendEqslEmail } from "./sendEmails";

logger.debug("Starting Cron Jobs");
cleanUnusedFilesJob.start();
sendEqslEmail.start();
