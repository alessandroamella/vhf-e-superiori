import crypto from "node:crypto";
import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import ejs from "ejs";
import moment from "moment";
import puppeteer from "puppeteer-core";
import sharp from "sharp";
import { envs, logger } from "../../shared";
import type { EventDoc } from "../event/models";
import type { QsoDoc } from "../qso/models";
import { wait } from "../utils/wait";

class MapExporter {
  private cache: Buffer | null = null;
  private lastFetched: moment.Moment | null = null;
  private cacheDuration = moment.duration(1, "day");

  async processImage(imgBuffer: Buffer): Promise<Buffer | null> {
    try {
      // Load image metadata to calculate new dimensions
      const metadata = await sharp(imgBuffer).metadata();
      if (!metadata.width || !metadata.height) {
        logger.error("Invalid image metadata");
        return null;
      }
      // const newWidth = Math.round(metadata.width * 0.5);
      // const newHeight = Math.round(metadata.height * 0.5);
      const newWidth = Math.round(metadata.width);
      const newHeight = Math.round(metadata.height);

      const buffer = await sharp(imgBuffer)
        .resize(newWidth, newHeight) // Resize to 50% of original
        .png({ quality: 95 })
        .toBuffer();

      logger.debug(`Map image processed to ${newWidth}x${newHeight}`);

      return buffer;
    } catch (error) {
      logger.error("Error processing image:");
      logger.error(error);
      return null;
    }
  }

  async fetchImage(): Promise<Buffer> {
    if (
      this.cache &&
      this.lastFetched &&
      moment().diff(this.lastFetched) < this.cacheDuration.asMilliseconds()
    ) {
      logger.debug("Serving image logo from cache");
      return this.cache;
    }

    logger.debug("Fetching new image logo from file");
    try {
      const imagePath = path.join(process.cwd(), "images", "logo-min.png"); // Path to local image
      const imageBuffer = await readFile(imagePath);
      const processedImage = await this.processImage(imageBuffer);
      if (!processedImage) {
        logger.error("Error processing image logo from file");
        return this.cache || Buffer.from("");
      }
      this.cache = processedImage;
      this.lastFetched = moment();
      return this.cache;
    } catch (error) {
      logger.error("Error fetching image logo from file");
      logger.error(error);
      throw error;
    }
  }

  async fetchMarkerAssets(): Promise<{ redIcon: string; shadowIcon: string }> {
    try {
      const redIconPath = path.join(
        process.cwd(),
        "assets",
        "marker-icon-2x-red.png",
      );
      const shadowIconPath = path.join(
        process.cwd(),
        "assets",
        "marker-shadow.png",
      );

      const [redIconBuffer, shadowIconBuffer] = await Promise.all([
        readFile(redIconPath),
        readFile(shadowIconPath),
      ]);

      return {
        redIcon: `data:image/png;base64,${redIconBuffer.toString("base64")}`,
        shadowIcon: `data:image/png;base64,${shadowIconBuffer.toString("base64")}`,
      };
    } catch (error) {
      logger.error("Error fetching marker assets from file");
      logger.error(error);
      throw error;
    }
  }

  private generateCacheKey(
    eventId: string,
    callsign: string | null,
    qsos: QsoDoc[],
  ): string {
    const sortedQsoIds = qsos
      .map((qso) => qso.id)
      .sort()
      .join(",");
    const str = `${eventId}_${callsign ? `${callsign}_` : ""}${sortedQsoIds}`;
    const cacheKey = crypto.createHash("sha256").update(str).digest("hex");
    logger.debug(
      `Generated cache key: ${cacheKey.slice(0, 6)}...${cacheKey.slice(-6)} from string: ${str}`,
    );
    return cacheKey;
  }

  private getCacheFilePath(cacheKey: string): string {
    const filename = `${cacheKey}.jpg`;
    return path.join(envs.BASE_TEMP_DIR, envs.MAPS_TMP_FOLDER, filename);
  }

  async exportMapToJpg(
    event: EventDoc,
    callsign: string | null,
    qsos: QsoDoc[],
    profilePic?: string,
    hasAllQsos = false,
  ): Promise<Buffer> {
    const eventDate = moment(event.date).utc().format("DD/MM/YYYY");

    const cacheKey = this.generateCacheKey(event.id, callsign, qsos);
    const cacheFilePath = this.getCacheFilePath(cacheKey);

    try {
      // Check if cached image exists
      await access(cacheFilePath);
      logger.debug(`Serving map from cache: ${cacheFilePath}`);
      const cachedImageBuffer = await readFile(cacheFilePath);
      return cachedImageBuffer;
    } catch (error) {
      // Cache miss or error accessing cache, proceed to generate new image
      logger.debug(
        `Cache miss for map, generating new image: ${cacheFilePath}`,
      );
      if (error && (error as { code: string })?.code !== "ENOENT") {
        // Log error if it's not just "file not found"
        logger.warn(
          `Error checking cache file (proceeding to generate new image): ${error}`,
        );
      } else {
        logger.debug(`Cache file not found: ${cacheFilePath}`);
      }
      // Continue with image generation
    }

    try {
      const image = await this.fetchImage();
      const imageBase64 = `data:image/png;base64,${image.toString("base64")}`;

      const markerAssets = await this.fetchMarkerAssets();

      const points = [
        ...qsos.map((qso) => [qso.toStationLat!, qso.toStationLon!]),
        ...qsos.map((qso) => [qso.fromStationLat!, qso.fromStationLon!]),
      ].filter(([lat, lon]) => lat && lon);

      logger.debug(`Points: ${JSON.stringify(points)}`);

      const templatePath = path.join(process.cwd(), "views/map.ejs");
      const templateContent = await readFile(templatePath, "utf-8");
      const renderedHtml = ejs.render(templateContent, {
        qsos,
        image: imageBase64,
        eventName: event.name,
        eventDate,
        callsign,
        profilePic,
        points,
        hasAllQsos,
        markerAssets,
      });

      // writeFileSync(path.join(process.cwd(), "map.html"), renderedHtml);

      logger.debug(
        `Exporting map to JPG with: ${JSON.stringify({
          event,
          callsign,
          "qsos (length)": qsos.length,
          profilePic,
          points,
          cacheKey,
          hasAllQsos,
        })}`,
      );

      const browser = await puppeteer.launch({
        executablePath: envs.CHROME_PATH,
        args: ["--no-sandbox"],
      });
      const page = await browser.newPage();
      await page.setContent(renderedHtml);
      await page.setViewport({
        width: 1080,
        height: 1080,
      });

      await page.waitForNetworkIdle(); // Wait for map to be rendered
      await wait(1000); // Wait for 1 second to ensure map is fully rendered

      const _buffer = await page.screenshot({
        type: "jpeg",
        fullPage: true,
      });

      await browser.close();

      // upscale to 1080p, export 90% jpg
      const buffer = await sharp(_buffer).jpeg({ quality: 95 }).toBuffer();

      logger.info(
        `Map of user ${callsign} for event ${event.name} exported to JPG with ${qsos.length} QSO(s) as cache key ${cacheKey}`,
      );

      // Save the generated image to cache
      try {
        await writeFile(cacheFilePath, Buffer.from(buffer));
        logger.debug(`Map saved to cache: ${cacheFilePath}`);
      } catch (cacheError) {
        logger.error(`Error saving map to cache: ${cacheError}`);
        // Non-critical error, continue to return the generated image
      }

      return Buffer.from(buffer);
    } catch (error) {
      logger.error("Error exporting map");
      logger.error(error);
      throw error; // Re-throw to handle error in calling function
    }
  }
}

export default MapExporter;
