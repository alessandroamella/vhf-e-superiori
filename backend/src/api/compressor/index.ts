import { spawn } from "node:child_process";
import ffmpeg from "@ffmpeg-installer/ffmpeg";
import { logger } from "../../shared";

logger.info(`Using FFmpeg path: ${ffmpeg.path} Version: ${ffmpeg.version}`);

class VideoCompressor {
  private inputPath: string;
  private outputPath: string;
  private percent: number;

  public getPercent(): number {
    return this.percent;
  }

  constructor(inputPath: string, outputPath: string) {
    this.inputPath = inputPath;
    this.outputPath = outputPath;
    this.percent = 0;
  }

  public async compress(): Promise<void> {
    logger.debug(
      `Starting compression: ${this.inputPath} -> ${this.outputPath}`,
    );
    return new Promise((resolve, reject) => {
      const process = spawn(ffmpeg.path, [
        "-i",
        this.inputPath,
        "-vf",
        "fps=30",
        "-c:v",
        "libx264",
        "-crf",
        "28",
        "-y", // overwrite output
        this.outputPath,
      ]);

      let duration: number | null = null;

      process.stderr.on("data", (data) => {
        const output = data.toString();

        // Extract duration from initial output
        if (!duration) {
          const durationMatch = output.match(
            /Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/,
          );
          if (durationMatch) {
            const hours = parseFloat(durationMatch[1]);
            const minutes = parseFloat(durationMatch[2]);
            const seconds = parseFloat(durationMatch[3]);
            duration = hours * 3600 + minutes * 60 + seconds;
          }
        }

        // Extract progress
        const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
        if (timeMatch && duration) {
          const hours = parseFloat(timeMatch[1]);
          const minutes = parseFloat(timeMatch[2]);
          const seconds = parseFloat(timeMatch[3]);
          const currentTime = hours * 3600 + minutes * 60 + seconds;
          this.percent = Math.min((currentTime / duration) * 100, 100);
        }
      });

      process.on("close", (code) => {
        if (code === 0) {
          logger.debug("Compression completed successfully");
          resolve();
        } else {
          reject(new Error(`FFmpeg exited with code ${code}`));
        }
      });

      process.on("error", (err) => {
        logger.error("Error during compression process");
        logger.error(err);
        reject(err);
      });
    });
  }
}

export default VideoCompressor;
