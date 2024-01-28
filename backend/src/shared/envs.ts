import { Errors } from "../api/errors";
import { logger } from "./logger";

const requiredEnvs = [
    "NODE_ENV",
    "PORT",
    "JWT_SECRET",
    "COOKIE_SECRET",
    "MONGODB_URI",
    "QRZ_USERNAME",
    "QRZ_PASSWORD",
    "RECAPTCHA_SECRET",
    "MAIL_SERVER",
    "MAIL_USERNAME",
    "MAIL_PASSWORD",
    "SEND_EMAIL_FROM",
    "TOT_ADMIN_EMAILS",
    "AWS_BUCKET_NAME",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "BASE_TEMP_DIR",
    "VID_COMPRESS_TMP_FOLDER",
    "FILE_UPLOAD_TMP_FOLDER",
    "QSL_CARD_TMP_FOLDER"
] as const;
export type Env = (typeof requiredEnvs)[number];

for (const e of requiredEnvs) {
    logger.debug("Checking env " + e);
    if (!(e in process.env)) {
        logger.error(Errors.MISSING_ENV + ": " + e);
        process.exit(1);
    }
}

type Envs = {
    [env in Env]: string;
};

export const envs: Envs = process.env as never;
