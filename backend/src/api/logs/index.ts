import { createReadStream, existsSync, readdirSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { cwd } from "node:process";
import { Router } from "express";
import { NOT_FOUND } from "http-status";
import { logger } from "../../shared";
import { createError } from "../helpers";
import isDev from "../middlewares/isDev";
import isLoggedIn from "../middlewares/isLoggedIn";

const router = Router();
const LOGS_DIR = join(cwd(), "logs");

// Get list of log files
router.get("/", isLoggedIn, isDev, (_req, res) => {
  try {
    if (!existsSync(LOGS_DIR)) {
      return res.json([]);
    }
    const files = readdirSync(LOGS_DIR).filter((f) => f.endsWith(".log"));
    // Sort by modification time (newest first)
    const sortedFiles = files
      .map((fileName) => {
        const fileInfo = statSync(join(LOGS_DIR, fileName));
        // logger.debug(
        //   `Found log file: ${fileName}, modified at ${fileInfo.mtime} (${moment(
        //     fileInfo.mtime,
        //   ).fromNow()})`,
        // );
        return {
          name: fileName,
          time: fileInfo.mtime.getTime(),
        };
      })
      .sort((a, b) => b.time - a.time)
      .map((f) => f.name);

    logger.debug(`Sorted log files: ${sortedFiles.join(", ")}`);

    return res.json(sortedFiles);
  } catch (err) {
    logger.error("Error listing logs");
    logger.error(err);
    return res.status(500).json(createError("Could not list logs"));
  }
});

// Get specific log content
router.get("/:filename", isLoggedIn, isDev, (req, res) => {
  try {
    const filename = basename(req.params.filename); // Prevent traversal
    const filePath = join(LOGS_DIR, filename);

    if (!filename.endsWith(".log") || !existsSync(filePath)) {
      return res.status(NOT_FOUND).json(createError("Log file not found"));
    }

    logger.debug(`Streaming log file: ${filePath}`);

    res.setHeader("Content-Type", "text/plain");
    const stream = createReadStream(filePath, "utf-8");
    stream.pipe(res);
  } catch (err) {
    logger.error("Error reading log file");
    logger.error(err);
    return res.status(500).json(createError("Could not read log file"));
  }
});

// Export specific log file
router.get("/:filename/export", isLoggedIn, isDev, (req, res) => {
  try {
    const filename = basename(req.params.filename); // Prevent traversal
    const filePath = join(LOGS_DIR, filename);

    if (!filename.endsWith(".log") || !existsSync(filePath)) {
      return res.status(NOT_FOUND).json(createError("Log file not found"));
    }

    logger.debug(`Exporting log file: ${filePath}`);

    res.download(filePath, filename);
  } catch (err) {
    logger.error("Error exporting log file");
    logger.error(err);
    return res.status(500).json(createError("Could not export log file"));
  }
});

export default router;
