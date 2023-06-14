import async from "async";
import { s3Client } from "../../aws";
import { logger } from "../../../shared";

export const uploadQueue = async.queue(async (task, callback) => {
    try {
        // Upload file logic here
        // For instance:
        const path = await s3Client.uploadFile(task);
        task.pathsArr.push(path);
        logger.info("File uploaded: " + task.f.name);
        callback();
    } catch (err) {
        logger.error("Error uploading file: " + task.f.name);
        logger.error(err);
        callback(err);
    }
}, 2);

uploadQueue.drain(() => {
    logger.info("All files have been uploaded");
});
