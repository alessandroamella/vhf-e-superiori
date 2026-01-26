import { CronJob } from "cron";
import { logger } from "../../shared";
import { User } from "./models";

const cleanupExpiredResets = new CronJob(
  "0 * * * *", // Run every hour at minute 0
  async () => {
    try {
      const result = await User.updateMany(
        { "passwordReset.expires": { $lt: new Date() } },
        { $unset: { passwordReset: 1 } },
      );

      if (result.modifiedCount > 0) {
        logger.debug(
          `Cron: Cleaned up ${result.modifiedCount} expired password resets`,
        );
      }
    } catch (err) {
      logger.error("Cron: Error cleaning expired password resets");
      logger.error(err);
    }
  },
  null,
  true, // Start the job right now
);

export default cleanupExpiredResets;
