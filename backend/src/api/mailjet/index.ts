import { logger } from "../../shared";
import { scheduleWeeklyContactDeletion } from "./delete-contacts";

export { mailjet } from "./client";

logger.info("Mailjet client initialized");

scheduleWeeklyContactDeletion();
