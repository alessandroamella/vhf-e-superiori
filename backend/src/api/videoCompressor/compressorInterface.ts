import { ChildProcess, fork } from "child_process";
import { basename, extname, join } from "path";
import { logger } from "../../shared";
import { Errors } from "../errors";
import { getUploadStatus, setCompressPercentage } from "../post/routes/upload";
import { VideoCompressorPayload, VideoCompressorResponse } from "./interfaces";

interface _CompressVideoInput {
    tempFilePath: string;
    md5: string;
}

export async function compressVideos(
    filesPath: _CompressVideoInput[]
): Promise<string[]> {
    logger.debug("Compressing videos: " + JSON.stringify(filesPath));
    const promises = filesPath.map(p => compressOneVideo(p));
    return await Promise.all(promises);
}

const processes = new Map<string, ChildProcess>();
function killProcess(md5: string) {
    const child = processes.get(md5);
    if (child) {
        child.kill();
        processes.delete(md5);
    }
}

function exitHandler(options: { [key: string]: boolean }, exitCode: number) {
    if (options.cleanup) logger.warn("exitHandler options.cleanup");
    if (exitCode || exitCode === 0) {
        logger.warn("exitHandler exitCode " + exitCode);
    }
    if (options.exit) {
        for (const [md5, child] of processes) {
            logger.warn("Killing process " + md5 + " with pid " + child.pid);
            child.kill();
        }
        process.exit();
    }
}

//do something when app is closing
process.on("exit", exitHandler.bind(null, { cleanup: true }));

//catches ctrl+c event
process.on("SIGINT", exitHandler.bind(null, { exit: true }));

// catches "kill pid" (for example: nodemon restart)
process.on("SIGUSR1", exitHandler.bind(null, { exit: true }));
process.on("SIGUSR2", exitHandler.bind(null, { exit: true }));

//catches uncaught exceptions
process.on("uncaughtException", exitHandler.bind(null, { exit: true }));

export function compressOneVideo({
    tempFilePath,
    md5
}: _CompressVideoInput): Promise<string> {
    return new Promise((resolve, reject) => {
        // Create a new child process
        const child = fork(
            join(__dirname, "./compressorProcess" + extname(__filename))
        );
        processes.set(md5, child);
        // fork("compressorProcess.ts");

        // Send message to child process
        child.send({
            tempFilePath,
            name: basename(tempFilePath),
            md5
        } as VideoCompressorPayload);

        // Listen for message from child process
        child.on("message", (message: VideoCompressorResponse) => {
            logger.debug("Video compressor sent message:");
            logger.debug(message);
            if (message?.errorStr) {
                killProcess(md5);
                return reject(message?.errorStr);
            } else if (typeof message?.percent !== "undefined") {
                logger.debug("Upload video percentage: " + message?.percent);
                logger.debug(message);
                setCompressPercentage(message?.md5, message?.percent);
                logger.debug("uploadStatus: ");
                logger.debug(getUploadStatus(message?.md5));
            } else if (!message?.outputPath) {
                killProcess(md5);
                return reject(Errors.VIDEO_COMPRESS_NO_OUTPUT_PATH);
            } else {
                killProcess(md5);
                return resolve(message.outputPath);
            }
        });

        child.on("error", err => {
            logger.error("Video compressor error:");
            logger.error(err);
            return reject(err);
        });
    });
}
