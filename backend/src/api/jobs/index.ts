import { logger } from "../../shared";
import { sendEqslEmailJob } from "./sendEmails";

logger.debug("Starting Cron Jobs");
sendEqslEmailJob.start();
