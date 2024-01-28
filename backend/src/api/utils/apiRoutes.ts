import { Router } from "express";

import authRoutes from "../auth/routes";
import eventRoutes from "../event/routes";
import joinRequestRoutes from "../joinRequest/routes";
import qrzRoutes from "../qrz/routes";
import counterRoutes from "../counter/routes";
import postRoutes from "../post/routes";
import commentRoutes from "../comment/routes";
import qsoRoutes from "../qso/routes";
import eqslRoutes from "../eqsl/routes";
import notFound from "./notFound";

import errorHandler from "../middlewares/errorHandler";
import populateUser from "../middlewares/populateUser";

import "../jobs"; // cron jobs

import morgan from "morgan";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import { logger, LoggerStream } from "../../shared/logger";
import { envs } from "../../shared/envs";
import { createError } from "../helpers";
import { Errors } from "../errors";
import { BAD_REQUEST, REQUEST_ENTITY_TOO_LARGE } from "http-status";
import { join } from "path";
import { cwd } from "process";

const router = Router();

router.use(morgan("dev", { stream: new LoggerStream() }));

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

router.use(cookieParser(envs.COOKIE_SECRET));

router.use(populateUser);

router.use(
    fileUpload({
        limits: { fileSize: 300 * 1024 * 1024 },
        abortOnLimit: true,
        // useTempFiles: false,
        tempFileDir: join(cwd(), "temp", "uploads"),
        useTempFiles: true,
        safeFileNames: true,
        preserveExtension: false,
        responseOnLimit: JSON.stringify(createError(Errors.FILE_SIZE_TOO_LARGE))
        // tempFileDir
    })
);
router.use((req, res, next) => {
    if (!req.files) return next();
    for (const key in req.files) {
        const fileArr = Array.isArray(req.files[key])
            ? (req.files[key] as fileUpload.UploadedFile[])
            : ([req.files[key]] as fileUpload.UploadedFile[]);
        if (fileArr.length > 7) {
            return res
                .status(BAD_REQUEST)
                .json(createError(Errors.TOO_MANY_FILES));
        }
        for (const f of fileArr) {
            if (f.size > 300 * 1024 * 1024) {
                logger.debug(
                    "Tried to upload file too large: " +
                        f.name +
                        ", size: " +
                        f.size +
                        " bytes"
                );
                return res
                    .status(REQUEST_ENTITY_TOO_LARGE)
                    .json(createError(Errors.FILE_SIZE_TOO_LARGE));
            }
        }
    }
    next();
});

router.use("/auth", authRoutes);
router.use("/event", eventRoutes);
router.use("/joinrequest", joinRequestRoutes);
router.use("/qrz", qrzRoutes);
router.use("/counter", counterRoutes);
router.use("/post", postRoutes);
router.use("/comment", commentRoutes);
router.use("/qso", qsoRoutes);
router.use("/eqsl", eqslRoutes);

router.use(errorHandler);
router.use(notFound);

export default router;
