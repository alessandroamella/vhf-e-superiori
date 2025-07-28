import axios, { isAxiosError } from "axios";
import { spawn } from "child_process";
import { toJSON } from "flatted";
import { createWriteStream, existsSync } from "fs";
import { mkdir, rm } from "fs/promises";
import { basename, join } from "path";
import { cwd } from "process";
import { v4 as uuidv4 } from "uuid";
import { envs, logger } from "../../shared";
import { BasePost } from "../post/models";

class Backup {
  private async downloadFile(url: string, path: string): Promise<string> {
    const exists = await axios
      .head(url, { timeout: 500 })
      .then(() => true)
      .catch(() => false);
    if (!exists) {
      logger.error(`File ${url} does not exist in backup downloadFile`);
      throw new Error(`File ${url} does not exist`);
    }

    logger.debug(`Downloading ${url} to ${path}`);
    const { data } = await axios.get(url, {
      responseType: "stream",
      timeout: 10000,
    });
    const writer = createWriteStream(path);
    data.pipe(writer);
    return new Promise((resolve, reject) => {
      writer.on("finish", () => {
        resolve(path);
      });
      writer.on("error", (err) => {
        logger.error("Error downloading file in backup downloadFile");
        logger.error(err);
        reject(err);
      });
    });
  }

  private async backupDb(_outPath?: string): Promise<string> {
    const outPath =
      _outPath ||
      join(cwd(), envs.BASE_TEMP_DIR, envs.MONGODUMP_FOLDER, uuidv4());
    const proc = spawn("mongodump", [
      "--uri",
      envs.MONGODB_URI,
      "--out",
      outPath,
    ]);
    logger.info(`Backing up db to ${outPath}`);
    return new Promise((resolve, reject) => {
      proc.on("close", (code) => {
        if (code === 0) {
          resolve(outPath);
        } else {
          logger.error("Error in backupDb");
          logger.error(code);
          reject(code);
        }
      });
    });
  }

  private async zipDb(dirPath: string): Promise<string> {
    const zipPath = join(
      cwd(),
      envs.BASE_TEMP_DIR,
      envs.MONGODUMP_FOLDER,
      uuidv4() + ".zip",
    );
    logger.info(`Zipping ${dirPath} to ${zipPath}`);
    // const proc = spawn("zip", ["-r", zipPath, dirPath], { cwd: dirPath });
    const proc = spawn("zip", ["-r", zipPath, "."], { cwd: dirPath });
    return new Promise((resolve, reject) => {
      proc.on("close", (code) => {
        if (code === 0) {
          resolve(zipPath);
        } else {
          logger.error("Error in zipDb");
          logger.error(code);
          reject(code);
        }
      });
    });
  }

  private async downloadPostsFiles(parentDir: string): Promise<string[]> {
    const posts = await BasePost.find({});

    const files: string[] = [];
    for (const post of posts) {
      for (const p of [...post.pictures, ...post.videos]) {
        try {
          const basePath = join(parentDir, "files");
          if (!existsSync(basePath)) {
            await mkdir(basePath, { recursive: true });
          }

          const path = await this.downloadFile(p, join(basePath, basename(p)));
          files.push(path);
        } catch (err) {
          logger.error("Error in downloadPostsFiles");
          logger.error(isAxiosError(err) ? toJSON(err?.response?.data) : err);
        }
      }
    }

    return files;
  }

  public async createBackup() {
    const dbPath = await this.backupDb();
    const files = await this.downloadPostsFiles(dbPath);

    logger.info("Files downloaded: " + files.length + " to " + dbPath);

    if (files.length === 0) {
      logger.error("No files downloaded in createBackup");
      await rm(dbPath, { recursive: true });
      return;
    }

    const zipPath = await this.zipDb(dbPath);
    await rm(dbPath, { recursive: true });

    logger.info("Backup complete: " + zipPath);

    return { dbPath, zipPath, files };
  }
}

export const backup = new Backup();
export default Backup;
