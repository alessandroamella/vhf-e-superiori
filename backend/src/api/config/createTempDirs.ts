import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { cwd } from "process";
import { envs, logger } from "../../shared";

// create temp dirs based on BASE_TEMP_DIR for all env vars ending with '_folder' or '_dir'
export function createTempDirs() {
    const { BASE_TEMP_DIR } = envs;

    // Find all environment variables that end with '_folder' or '_dir'
    const dirEnvs = Object.entries(envs).filter(
        ([key, value]) =>
            (key.toLowerCase().endsWith("_folder") ||
                key.toLowerCase().endsWith("_dir")) &&
            key !== "BASE_TEMP_DIR" && // Exclude BASE_TEMP_DIR as it's handled separately
            typeof value === "string" &&
            value.length > 0
    );

    const tempDirs = dirEnvs
        .map(([, value]) => value)
        .filter((value) => typeof value === "string");

    for (const dir of [
        BASE_TEMP_DIR,
        ...tempDirs.map((d) => join(BASE_TEMP_DIR, d))
    ]) {
        const tempDir = join(cwd(), dir);
        if (!existsSync(tempDir)) {
            logger.info("Creating temp dir: " + tempDir);
            mkdirSync(tempDir, { recursive: true });
        } else {
            logger.debug("Temp dir already exists: " + tempDir);
        }
    }

    logger.debug("Temp dir creation complete");
}
