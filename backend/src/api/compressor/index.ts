import ffmpeg from "fluent-ffmpeg";

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
    return new Promise((resolve, reject) => {
      ffmpeg(this.inputPath)
        .fps(30)
        .addOptions([
          "-crf 28", // , "--preset veryfast"
        ])
        .videoCodec("libx264")
        .on("progress", (progress) => {
          this.percent = progress.percent || 0;
        })
        .on("end", () => {
          resolve();
        })
        .on("error", (err) => {
          reject(err?.message || err);
        })
        .save(this.outputPath);
    });
  }
}

export default VideoCompressor;
