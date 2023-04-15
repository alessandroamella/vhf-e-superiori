import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import { VideoCompressorPayload, VideoCompressorResponse } from "./interfaces";
import { join } from "path";
import { cwd } from "process";

// type Send =
//     | NodeJS.Process["send"]
//     | ((msg: VideoCompressorResponse) => unknown);

process.on("message", (payload: VideoCompressorPayload) => {
    const { tempFilePath, name } = payload;
    const endProcess = (endPayload: VideoCompressorResponse) => {
        const { errorStr, outputPath } = endPayload;

        if (typeof process.send === "undefined") {
            throw new Error(
                "process.send is not a function in videoCompressor"
            );
        }

        try {
            // Remove temp file
            fs.unlinkSync(tempFilePath);
            // Format response so it fits the API response
            process.send({ errorStr, outputPath });
            process.exit(0);
        } catch (err) {
            // End process
            process.send({
                errorStr: (err as Error)?.message || (err?.toString() as string)
            });
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
        .on("end", () => {
            endProcess({ outputPath });
        })
        .on("error", err => {
            endProcess({ errorStr: err.message });
        })
        .save(outputPath);
});
