import axios from "axios";
import crypto from "crypto";
import ejs from "ejs";
import { access, readFile, writeFile } from "fs/promises";
import moment from "moment";
import path from "path";
import puppeteer from "puppeteer-core";
import sharp from "sharp";
import { envs, logger } from "../../shared";
import type { EventDoc } from "../event/models";
import type { QsoDoc } from "../qso/models";
import { wait } from "../utils/wait";

type Coordinate = {
    lat: number;
    lon: number;
};

class MapExporter {
    private cache: Buffer | null = null;
    private lastFetched: moment.Moment | null = null;
    private cacheDuration = moment.duration(1, "day");
    private imageUrl = "https://www.vhfesuperiori.eu/logo-min.png";

    async processImage(imgBuffer: Buffer): Promise<Buffer | null> {
        try {
            // Load image metadata to calculate new dimensions
            const metadata = await sharp(imgBuffer).metadata();
            if (!metadata.width || !metadata.height) {
                logger.error("Invalid image metadata");
                return null;
            }
            const newWidth = Math.round(metadata.width * 0.1);
            const newHeight = Math.round(metadata.height * 0.1);

            const buffer = await sharp(imgBuffer)
                .resize(newWidth, newHeight) // Resize to 10% of original
                .png({ quality: 80, compressionLevel: 9 }) // Optimize PNG
                .toBuffer();

            logger.debug("Image processed successfully");

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
            moment().diff(this.lastFetched) <
                this.cacheDuration.asMilliseconds()
        ) {
            logger.debug("Serving image logo from cache");
            return this.cache;
        }

        logger.debug("Fetching new image logo");
        try {
            const response = await axios.get(this.imageUrl, {
                responseType: "arraybuffer"
            });
            const processedImage = await this.processImage(
                Buffer.from(response.data)
            );
            if (!processedImage) {
                logger.error("Error processing image logo");
                return this.cache || Buffer.from("");
            }
            this.cache = processedImage;
            this.lastFetched = moment();
            return this.cache;
        } catch (error) {
            logger.error("Error fetching image logo");
            logger.error(error);
            throw error;
        }
    }

    private generateCacheKey(
        eventId: string,
        callsign: string,
        qsos: QsoDoc[]
    ): string {
        const sortedQsoIds = qsos
            .map((qso) => qso.id)
            .sort()
            .join(",");
        const str = `${eventId}_${callsign}_${sortedQsoIds}`;
        return crypto.createHash("sha256").update(str).digest("hex");
    }

    private getCacheFilePath(cacheKey: string): string {
        const filename = `${cacheKey}.jpg`;
        return path.join(envs.BASE_TEMP_DIR, envs.MAPS_TMP_FOLDER, filename);
    }

    private haversineDistance(coord1: Coordinate, coord2: Coordinate) {
        const R = 6371; // Radius of the Earth in km
        const toRad = (deg: number) => deg * (Math.PI / 180);

        const dLat = toRad(coord2.lat - coord1.lat);
        const dLon = toRad(coord2.lon - coord1.lon);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(coord1.lat)) *
                Math.cos(toRad(coord2.lat)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private findFarthestPoints(coords: Coordinate[]) {
        let maxDist = 0;
        let outermostPoints = [coords[0], coords[1]];

        for (let i = 0; i < coords.length; i++) {
            for (let j = i + 1; j < coords.length; j++) {
                const dist = this.haversineDistance(coords[i], coords[j]);
                if (dist > maxDist) {
                    maxDist = dist;
                    outermostPoints = [coords[i], coords[j]];
                }
            }
        }
        return outermostPoints;
    }

    private geographicalCenter(coords: Coordinate[]) {
        if (coords.length < 2)
            throw new Error("At least two coordinates are required");

        const [point1, point2] = this.findFarthestPoints(coords);

        return {
            lat: (point1.lat + point2.lat) / 2,
            lon: (point1.lon + point2.lon) / 2
        };
    }

    private getZoom(x: number) {
        const y = -0.00294 * x + 8.529;
        return 0.5 + Number(y.toFixed(2));
    }

    async exportMapToJpg(
        event: EventDoc,
        callsign: string,
        qsos: QsoDoc[],
        profilePic?: string
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
                `Cache miss for map, generating new image: ${cacheFilePath}`
            );
            if (error && (error as { code: string })?.code !== "ENOENT") {
                // Log error if it's not just "file not found"
                logger.warn(
                    `Error checking cache file (proceeding to generate new image): ${error}`
                );
            } else {
                logger.debug(`Cache file not found: ${cacheFilePath}`);
            }
            // Continue with image generation
        }

        try {
            const image = await this.fetchImage();
            const imageBase64 = `data:image/png;base64,${image.toString(
                "base64"
            )}`;

            const coords = [
                ...qsos.map((qso) => ({
                    lat: qso.toStationLat!,
                    lon: qso.toStationLon!
                })),
                ...qsos.map((qso) => ({
                    lat: qso.fromStationLat!,
                    lon: qso.fromStationLon!
                }))
            ].filter((coord) => coord.lat && coord.lon);

            const center = this.geographicalCenter(coords);

            const [farthestPoint1, farthestPoint2] =
                this.findFarthestPoints(coords);

            // zoom is based on the distance between the two farthest points
            const maxDistance = this.haversineDistance(
                farthestPoint1,
                farthestPoint2
            );

            const zoom = this.getZoom(maxDistance);

            const templatePath = path.join(process.cwd(), "views/map.ejs");
            const templateContent = await readFile(templatePath, "utf-8");
            const renderedHtml = ejs.render(templateContent, {
                qsos,
                image: imageBase64,
                eventName: event.name,
                eventDate,
                callsign,
                profilePic,
                center,
                zoom
            });

            logger.debug(
                `Exporting map to JPG with: ${JSON.stringify(
                    {
                        event,
                        callsign,
                        "qsos (length)": qsos.length,
                        profilePic,
                        center,
                        zoom
                    },
                    null,
                    2
                )}`
            );

            const browser = await puppeteer.launch({
                executablePath: envs.CHROME_PATH,
                args: ["--no-sandbox"]
            });
            const page = await browser.newPage();
            await page.setContent(renderedHtml);
            await page.setViewport({
                width: 1280,
                height: 720
            });

            await page.waitForNetworkIdle(); // Wait for map to be rendered
            await wait(1000); // Wait for 1 second to ensure map is fully rendered

            const _buffer = await page.screenshot({
                type: "jpeg",
                fullPage: true
            });

            await browser.close();

            // upscale to 1080p, export 90% jpg
            const buffer = await sharp(_buffer)
                .jpeg({ quality: 90 })
                .toBuffer();

            logger.info(
                `Map of user ${callsign} for event ${event.name} exported to JPG with ${qsos.length} QSO(s) as cache key ${cacheKey}`
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
