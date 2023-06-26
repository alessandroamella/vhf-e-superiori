import path from "path";
import { createLogger, format, transports } from "winston";

const { combine, timestamp, colorize, printf, errors, label, json } = format;

const combinedLogsFile = path.join("./logs/combined.log");
const errorsLogsFile = path.join("./logs/error.log");

export const logger = createLogger({
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    format: combine(
        label({ label: path.basename(require.main?.filename || "") }),
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        errors({ stack: true })
    ),
    transports: [
        new transports.Console({
            format: combine(
                colorize(),
                printf(
                    info =>
                        `${info.timestamp} ${info.level} [${info.label}]: ${info.message}`
                )
            )
        }),
        new transports.File({
            filename: combinedLogsFile,
            format: json(),
            maxsize: 10000000
        }),
        new transports.File({
            filename: errorsLogsFile,
            level: "error",
            format: json(),
            maxsize: 20000000
        })
    ]
});

export class LoggerStream {
    public write(message: string) {
        logger.debug(message);
    }
}
