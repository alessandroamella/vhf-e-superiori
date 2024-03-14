import { logger } from "../../shared";
import { cleanTempDirJob } from "./cleanTemp";
import { sendEqslEmailJob } from "./sendEmails";

logger.debug("Starting Cron Jobs");
cleanTempDirJob.start();
sendEqslEmailJob.start();
