import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { cwd } from "process";
import { envs, logger } from "../../shared";

// create temp dirs in process cwd called "videoOutput" and "uploads"
export function createTempDirs() {
    const { BASE_TEMP_DIR, FILE_UPLOAD_TMP_FOLDER, VID_COMPRESS_TMP_FOLDER } =
        envs;
    const tempDirs = [FILE_UPLOAD_TMP_FOLDER, VID_COMPRESS_TMP_FOLDER];

    for (const dir of [
        BASE_TEMP_DIR,
        ...tempDirs.map(d => join(BASE_TEMP_DIR, d))
    ]) {
        const tempDir = join(cwd(), dir);
        if (!existsSync(tempDir)) {
            logger.info("Creating temp dir: " + tempDir);
            mkdirSync(tempDir);
        }
    }

    logger.debug("Temp dir creation complete");
}
