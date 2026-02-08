import { logger } from "../../shared";
import {
  scheduleHourlyContactCheck,
  scheduleWeeklyContactDeletion,
} from "./delete-contacts";

export { mailjet } from "./client";

logger.info("Mailjet client initialized");

scheduleWeeklyContactDeletion();
scheduleHourlyContactCheck();
