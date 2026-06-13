import mongoose from "mongoose";
import { envs } from "../../shared/envs";
import { logger } from "../../shared/logger";

mongoose.set("strictQuery", false);

mongoose.connection.on("error", (err) => {
  logger.error("Error while connecting to MongoDB");
  logger.error(err);
});
mongoose.connection.on("connecting", () => {
  logger.info("Connecting to MongoDB");
});
mongoose.connection.on("connected", () => {
  logger.info("Connected to MongoDB");
});
mongoose.connection.on("reconnected", () => {
  logger.info("Reconnected to MongoDB");
});
mongoose.connection.on("disconnecting", () => {
  logger.info("Disconnecting from MongoDB");
});
mongoose.connection.on("disconnected", () => {
  logger.info("Disconnected from MongoDB");
});

(async () => {
  try {
    logger.debug(`Connecting to MongoDB at ${envs.MONGODB_URI}`);
    await mongoose.connect(envs.MONGODB_URI, { timeoutMS: 10000 });

    // One-time, idempotent data migrations that need an open connection.
    const { migrateBeaconOwners } = await import("../beacon/migrateOwners");
    await migrateBeaconOwners();
  } catch (err) {
    logger.error("Error while connecting to MongoDB");
    logger.error(err);
    process.exit(1);
  }
})();
