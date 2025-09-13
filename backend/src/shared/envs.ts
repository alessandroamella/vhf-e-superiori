import { cleanEnv, str } from "envalid";
import { Errors } from "../api/errors";
import { logger } from "./logger";

export const envs = cleanEnv(
  process.env,
  {
    NODE_ENV: str(),
    PORT: str(),
    JWT_SECRET: str(),
    COOKIE_SECRET: str(),
    MONGODB_URI: str(),
    QRZ_USERNAME: str(),
    QRZ_PASSWORD: str(),
    TURNSTILE_SECRET: str(),
    MAIL_SERVER: str(),
    MAIL_USERNAME: str(),
    MAIL_PASSWORD: str(),
    SEND_EMAIL_FROM: str(),
    TOT_ADMIN_EMAILS: str(),
    AWS_BUCKET_NAME: str(),
    AWS_ACCESS_KEY_ID: str(),
    AWS_SECRET_ACCESS_KEY: str(),
    BASE_TEMP_DIR: str(),
    FILE_UPLOAD_TMP_FOLDER: str(),
    QSL_CARD_TMP_FOLDER: str(),
    MAPS_TMP_FOLDER: str(),
    MONGODUMP_FOLDER: str(),
    GOOGLE_MAPS_API_KEY: str(),
    AWS_REGION: str(),
    CHROME_PATH: str(),
  },
  {
    reporter: ({ errors }) => {
      if (Object.keys(errors).length > 0) {
        for (const [envVar, error] of Object.entries(errors)) {
          logger.error(`${Errors.MISSING_ENV}: ${envVar} (${error})`);
        }
        process.exit(1);
      }
    },
  },
);
