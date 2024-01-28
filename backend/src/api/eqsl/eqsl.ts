import axios, { isAxiosError } from "axios";
// import Jimp from "jimp";
import { envs, logger } from "../../shared";
import { s3Client } from "../aws";
import path from "path";
import sharp from "sharp";
import { spawn } from "child_process";
import { unlink } from "fs/promises";
import { QsoDoc } from "../qso/models";
import moment from "moment";

class EqslPic {
    private href: string;
    private image: Buffer | null = null;

    constructor(href: string) {
        this.href = href;
    }

    public getHref(): string {
        return this.href;
    }

    public getImage(): Buffer | null {
        return this.image;
    }

    public async fetchImage(buffer?: Buffer): Promise<void> {
        if (buffer) {
            this.image = buffer;
            return;
        }

        try {
            const response = await axios.get(this.href, {
                responseType: "arraybuffer"
            });
            const minifiedImg = await sharp(response.data)
                .toFormat("jpeg")
                .jpeg({ quality: 69 })
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
            `eqsl-${Date.now()}.jpg`
        )
    ): Promise<string> {
        if (!this.image) {
            throw new Error("Image not fetched in saveImageToFile");
        }
        await sharp(this.image).toFile(_path);
        return _path;
    }

    public async addQsoInfo(qso: QsoDoc): Promise<void> {
        if (!this.image) {
            throw new Error("Image not fetched in addQsoInfo");
        }
        // spawn subprocess with ImageMagick
        const tempDir = path.join(envs.BASE_TEMP_DIR, envs.QSL_CARD_TMP_FOLDER);
        const filePath = path.join(tempDir, `eqsl-${Date.now()}.jpg`);
        const outPath = path.join(tempDir, `eqsl-${Date.now()}-out.jpg`);
        await this.saveImageToFile(filePath);
        logger.debug("Saved eQSL image to file " + filePath);
        const proc = spawn("convert", [
            filePath,
            "-font",
            "Helvetica-Bold",
            "-pointsize",
            "180",
            "-fill",
            // Colore del testo (verde chiaro)
            "#90EE90",
            "-stroke",
            "black", // Colore del contorno (nero)
            "-strokewidth",
            "2", // Larghezza del contorno
            "-gravity",
            "South",
            // "-shadow",
            // "100x3", // Imposta l'ombra con un offset orizzontale di 100 pixel e una deviazione di 3 pixel
            "-annotate",
            "+0+155",
            qso.callsign,
            outPath
        ]);
        await new Promise<void>((resolve, reject) => {
            proc.on("close", code => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error("ImageMagick error"));
                }
            });
        });

        await unlink(filePath);
        const outPath2 = path.join(tempDir, `eqsl-${Date.now()}-out2.jpg`);

        const proc2 = spawn("convert", [
            outPath,
            "-font",
            "Helvetica-Bold",
            "-pointsize",
            "30",
            "-fill",
            // Colore del testo (verde chiaro)
            "white",
            "-stroke",
            "black", // Colore del contorno (nero)
            "-strokewidth",
            "1", // Larghezza del contorno
            "-gravity",
            "South",
            "-annotate",
            "+0+0",
            `Data:${moment(qso.qsoDate).format("DD-MM-YYYY")} ora:${moment(
                qso.qsoDate
            ).format("HH:mm")} modo:${qso.mode} freq:${
                qso.frequency
            }`.toUpperCase(),
            outPath2
        ]);

        await new Promise<void>((resolve, reject) => {
            proc2.on("close", code => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error("ImageMagick error"));
                }
            });
        });

        const img = await sharp(outPath2).toBuffer();
        this.image = img;

        await unlink(outPath);
        await unlink(outPath2);

        logger.debug("Added text to eQSL image");
    }

    public async uploadImage(stationId: string): Promise<string> {
        if (!this.image) {
            throw new Error("Image not fetched in uploadImage");
        }
        // save image to file
        const tempDir = path.join(envs.BASE_TEMP_DIR, envs.QSL_CARD_TMP_FOLDER);
        const fileName = `eqsl-${stationId}-${Date.now()}.jpg`;
        const filePath = path.join(tempDir, fileName);
        await this.saveImageToFile(filePath);

        const mimeType = "image/jpeg";

        logger.info("Uploading EQSL pic file to S3");
        try {
            const awsPath = await s3Client.uploadFile({
                fileName: s3Client.generateFileName({
                    userId: stationId,
                    mimeType
                }),
                filePath,
                mimeType,
                folder: "eqsl"
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
}

export default EqslPic;
