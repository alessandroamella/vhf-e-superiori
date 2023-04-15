import { fork } from "child_process";
import { basename, extname, join } from "path";
import { logger } from "../../shared";
import { Errors } from "../errors";
import { VideoCompressorPayload, VideoCompressorResponse } from "./interfaces";

export async function compressVideos(filesPath: string[]): Promise<string[]> {
    logger.debug("Compressing videos: " + filesPath);
    const promises = filesPath.map(p => compressOneVideo(p));
    return await Promise.all(promises);
}

export function compressOneVideo(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        // Create a new child process
        const child = fork(
            join(__dirname, "./compressorProcess" + extname(__filename))
        );
        // fork("compressorProcess.ts");

        // Send message to child process
        child.send({
            tempFilePath: filePath,
            name: basename(filePath)
        } as VideoCompressorPayload);

        // Listen for message from child process
        child.on("message", (message: VideoCompressorResponse) => {
            logger.debug("Video compressor sent message:");
            logger.debug(message);
            if (message?.errorStr) {
                return reject(message?.errorStr);
            } else if (!message?.outputPath) {
                return reject(Errors.VIDEO_COMPRESS_NO_OUTPUT_PATH);
            }
            return resolve(message.outputPath);
        });

        child.on("error", err => {
            logger.error("Video compressor error:");
            logger.error(err);
            return reject(err);
        });
    });
}
