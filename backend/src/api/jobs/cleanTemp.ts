import { CronJob } from "cron";
import { readdir, rm, stat } from "fs/promises";
import moment from "moment";
import { join } from "path";
import { cwd } from "process";
import { envs, logger } from "../../shared";

async function cleanTempDir() {
  logger.info("Running Cron Job to clean temp directory");

  const tmpPaths = [
    envs.FILE_UPLOAD_TMP_FOLDER,
    envs.QSL_CARD_TMP_FOLDER,
    envs.MONGODUMP_FOLDER,
  ].map((e) => join(cwd(), envs.BASE_TEMP_DIR, e));

  for (const tmpPath of tmpPaths) {
    const files = await readdir(tmpPath);

    for (const file of files) {
      const filePath = join(tmpPath, file);

      // get file creation date
      const { birthtime } = await stat(filePath);
      if (moment().diff(birthtime, "days") < 1) {
        logger.info(`File ${filePath} is less than 1 day old, skipping`);
        continue;
      }

      logger.info(`Deleting file ${filePath}`);
      await rm(filePath, { recursive: true });
    }
  }

  logger.info("Cron Job to clean temp directory completed");
}

export const cleanTempDirJob = new CronJob(
  "00 01 * * *",
  cleanTempDir,
  null,
  false,
  "Europe/Rome",
);
