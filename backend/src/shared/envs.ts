import { Errors } from "../api/errors";
import { logger } from ".";

const requiredEnvs = [
    "NODE_ENV",
    "JWT_SECRET",
    "COOKIE_SECRET",
    "MONGODB_URI",
    "QRZ_USERNAME",
    "QRZ_PASSWORD"
] as const;
export type Env = typeof requiredEnvs[number];

for (const e of requiredEnvs) {
    if (!(e in process.env)) {
        logger.error(Errors.MISSING_ENV + ": " + e);
        process.exit(1);
    }
}

type Envs = {
    [env in Env]: string;
};

export const envs: Envs = process.env as any;
