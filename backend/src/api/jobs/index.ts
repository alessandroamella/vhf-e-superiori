import { logger } from "../../shared";
import { cleanUnusedFilesJob } from "./cleanUnusedFiles";

logger.debug("Starting Cron Jobs");
cleanUnusedFilesJob.start();
