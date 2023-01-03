import mongoose from "mongoose";
import { envs } from "../../shared/envs";
import { logger } from "../../shared/logger";

mongoose.set("strictQuery", false);

(async function () {
    // Attempt connection 3 times
    // for (let i = 0; i < 3; i++) {
    try {
        await mongoose.connect(envs.MONGODB_URI);
        // break;
    } catch (err) {
        logger.error("Error while connecting to MongoDB");
        logger.error(err);
        // if (i === 2) process.exit(1);
    }
    // }
})();

mongoose.connection.on("error", err => {
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
