import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import { VideoCompressorPayload, VideoCompressorResponse } from "./interfaces";
import { join } from "path";
import { cwd } from "process";

// type Send =
//     | NodeJS.Process["send"]
//     | ((msg: VideoCompressorResponse) => unknown);

process.on("message", (payload: VideoCompressorPayload) => {
    const { tempFilePath, name, md5 } = payload;

    const handleMsg = (endPayload: Omit<VideoCompressorResponse, "md5">) => {
        const { errorStr, outputPath, percent } = endPayload;

        if (typeof process.send === "undefined") {
            throw new Error(
                "process.send is not a function in videoCompressor"
            );
        }

        // check if undefined since it could be 0 and
        // it would return false
        if (typeof percent !== "undefined") {
            // not finished nor error, just percent
            process.send({ percent, md5 } as VideoCompressorResponse);
            return;
        }

        try {
            // Remove temp file
            fs.unlinkSync(tempFilePath);
            // Format response so it fits the API response
            process.send({
                errorStr,
                outputPath,
                md5
            } as VideoCompressorResponse);
            process.exit(0);
        } catch (err) {
            // End process
            process.send({
                md5,
                errorStr: (err as Error)?.message || (err?.toString() as string)
            } as VideoCompressorResponse);
            process.exit(1);
        }
    };
    // Process video and send back the result
    const outputPath = join(cwd(), "temp", "videoOutput", name + ".mp4");
    ffmpeg(tempFilePath)
        .fps(30)
        .addOptions([
            "-crf 28"
            // , "--preset veryfast"
        ])
        .videoCodec("libx264")
        .on("progress", progress => {
            handleMsg({ percent: progress.percent });
        })
        .on("end", () => {
            handleMsg({ outputPath });
        })
        .on("error", err => {
            handleMsg({ errorStr: err.message });
        })
        .save(outputPath);
});
