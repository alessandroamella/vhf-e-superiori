import axios, { isAxiosError } from "axios";
// import Jimp from "jimp";
import { envs, logger } from "../../shared";
import { s3Client } from "../aws";
import path from "path";
import sharp from "sharp";
import { spawn } from "child_process";
import { QsoDoc } from "../qso/models";
import moment from "moment";
import { existsSync } from "fs";
import { unlink } from "fs/promises";

class EqslPic {
    private href: string | null = null;
    private image: Buffer | null = null;

    constructor(href: string | Buffer) {
        if (href instanceof Buffer) {
            this.image = href;
        } else {
            this.href = href;
        }
    }

    public getHref(): string | null {
        return this.href;
    }

    public getImage(): Buffer | null {
        return this.image;
    }

    public async fetchImage(buffer?: Buffer): Promise<void> {
        if (buffer) {
            this.image = buffer;
            return;
        } else if (!this.href) {
            throw new Error("No href in fetchImage");
        }

        try {
            const response = await axios.get(this.href, {
                responseType: "arraybuffer"
            });
            const minifiedImg = await sharp(response.data)
                .toFormat("jpeg")
                .jpeg({ quality: 90 })
                .toBuffer();
            this.image = minifiedImg;

            logger.debug("Fetched eQSL image from " + this.href);
        } catch (err) {
            logger.error("Error fetching eQSL image from " + this.href);
            logger.error(isAxiosError(err) ? err?.response?.data : err);
            throw err;
        }
    }

    public async saveImageToFile(
        _path: string = path.join(
            envs.BASE_TEMP_DIR,
            envs.QSL_CARD_TMP_FOLDER,
            `eqsl-${moment().unix()}.png`
        )
    ): Promise<string> {
        if (!this.image) {
            throw new Error("Image not fetched in saveImageToFile");
        }
        await sharp(this.image).toFile(_path);
        return _path;
    }

    public async addQsoInfo(
        qso: QsoDoc,
        templatePath: string | null = null
    ): Promise<void> {
        if (!this.image) {
            throw new Error("Image not buffered in addQsoInfo");
        }
        // spawn subprocess with ImageMagick
        const tempDir = path.join(envs.BASE_TEMP_DIR, envs.QSL_CARD_TMP_FOLDER);
        const epoch = moment(qso.qsoDate).unix();
        const guid = qso._id.toString();
        const tempPath = path.join(tempDir, `eqsl-${epoch}-${guid}-tmp.png`); // temp image with text
        const outPath = path.join(tempDir, `eqsl-${epoch}-${guid}-out.png`); // output image
        const filePath =
            templatePath ?? path.join(tempDir, `eqsl-${epoch}-${guid}.png`); // eQSL card template
        if (!templatePath) await this.saveImageToFile(filePath);
        logger.debug("Saved eQSL image to file " + filePath);

        const text2 = `Data:${moment(qso.qsoDate).format(
            "DD-MM-YYYY"
        )} ora:${moment(qso.qsoDate).format("HH:mm")} modo:${qso.mode} freq:${
            qso.frequency
        }`.toUpperCase();
        const args = [
            tempPath, // temp image with text
            outPath, // output image
            path.join(process.cwd(), "fonts/coors.ttf"), // font path
            "100", // +y offset from center
            qso.callsign, // text
            filePath, // input image (eQSL card template)
            "300", // font size
            "green", // text color
            "black", // text stroke color
            text2, // text 2
            path.join(process.cwd(), "fonts/Roboto-Black.ttf"), // font path 2
            "460", // +y offset from center 2
            "55", // font size 2
            "black", // text color 2
            "white" // text stroke color 2
        ];
        logger.debug(
            "Calling ImageMagick to add text to eQSL image with args: "
        );
        logger.debug('"' + args.join('" "') + '"');

        // check that filePath exists
        if (!existsSync(filePath)) {
            logger.error(
                "eQSL card template file does not exist at " + filePath
            );
        }
        const proc = spawn(
            path.join(process.cwd(), "scripts/gen_image.sh"),
            args
        );
        await new Promise<void>((resolve, reject) => {
            proc.on("error", err => {
                logger.error("ImageMagick error:");
                logger.error(err);
                reject(err);
            });
            proc.stdout.on("data", data => {
                logger.info("ImageMagick stdout:");
                logger.info(data.toString());
            });
            proc.stderr.on("data", data => {
                logger.error("ImageMagick stderr:");
                logger.error(data.toString());
                reject(data);
            });
            proc.on("close", code => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error("ImageMagick exited with code " + code));
                }
            });
        });

        const img = await sharp(outPath).toBuffer();
        this.image = img;

        if (!templatePath) {
            logger.debug(
                "Deleting temp template eQSL image file at " + filePath
            );
            await unlink(filePath);
        }
        logger.debug("Deleting temp out eQSL image file at " + tempPath);
        await unlink(outPath);

        logger.debug("Added text to eQSL image");
    }

    public async uploadImage(
        stationId: string,
        isEqslTemplate = false
    ): Promise<string> {
        if (!this.image) {
            throw new Error("Image not fetched in uploadImage");
        }

        // get this image as jpg and compress
        this.image = await sharp(this.image)
            .toFormat("jpeg")
            .jpeg({ quality: 80 })
            .toBuffer();

        // save image to file
        const tempDir = path.join(envs.BASE_TEMP_DIR, envs.QSL_CARD_TMP_FOLDER);
        const fileName = `eqsl-${stationId}-${moment().unix()}-aws.jpg`;
        const filePath = path.join(tempDir, fileName);
        await this.saveImageToFile(filePath);

        const mimeType = "image/jpeg";

        logger.info("Uploading EQSL pic file to S3 named " + fileName);
        try {
            const awsPath = await s3Client.uploadFile({
                fileName: s3Client.generateFileName({
                    userId: stationId,
                    mimeType
                }),
                filePath,
                mimeType,
                folder: isEqslTemplate ? "eqslbase" : "eqsl"
            });
            if (!awsPath) throw new Error("No awsPath in eQSL picture upload");
            logger.info("eQSL picture file uploaded: " + awsPath);
            this.href = awsPath;
            this.image = null;
            return awsPath;
        } catch (err) {
            logger.error("Error uploading eQSL picture file: " + filePath);
            logger.error(err);
            throw err;
        }
    }

    public async deleteImage(): Promise<void> {
        if (!this.href) {
            throw new Error("No href in deleteImage");
        }
        try {
            await s3Client.deleteFile({
                filePath: this.href,
                bucket: envs.AWS_BUCKET_NAME
            });
            logger.info("Deleted eQSL image from S3: " + this.href);
        } catch (err) {
            logger.error("Error deleting eQSL image from S3: " + this.href);
            logger.error(err);
            throw err;
        }
    }
}

export default EqslPic;
