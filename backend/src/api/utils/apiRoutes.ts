import { Router } from "express";

import adifRoutes from "../adif/routes";
import authRoutes from "../auth/routes";
import autocompleteRoutes from "../autocomplete/routes";
import backupRoutes from "../backup/routes";
import beaconRoutes from "../beacon/routes";
import blogRoutes from "../blog/routes";
import commentRoutes from "../comment/routes";
import counterRoutes from "../counter/routes";
import documentRoutes from "../document/routes";
import eqslRoutes from "../eqsl/routes";
import eventRoutes from "../event/routes";
import joinRequestRoutes from "../joinRequest/routes";
import locationRoutes from "../location/routes";
import logsRoute from "../logs";
import mapRoutes from "../map/routes";
import errorHandler from "../middlewares/errorHandler";
import impersonate from "../middlewares/impersonate";
import populateUser from "../middlewares/populateUser";
import postRoutes from "../post/routes";
import qrzRoutes from "../qrz/routes";
import qsoRoutes from "../qso/routes";
import rankingsRoutes from "../rankings/routes";
import notFound from "./notFound";

import "../jobs"; // cron jobs

import { join } from "node:path";
import { cwd } from "node:process";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import { BAD_REQUEST, REQUEST_ENTITY_TOO_LARGE } from "http-status";
import morgan from "morgan";
import { envs } from "../../shared/envs";
import { LoggerStream, logger } from "../../shared/logger";
import { Errors } from "../errors";
import { createError } from "../helpers";

const router = Router();

router.use(morgan("dev", { stream: new LoggerStream() }));

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

router.use(cookieParser(envs.COOKIE_SECRET));

router.use(populateUser);

router.use(impersonate);

router.use(
  fileUpload({
    limits: { fileSize: 100 * 1024 * 1024 },
    abortOnLimit: true,
    // useTempFiles: false,
    tempFileDir: join(cwd(), envs.BASE_TEMP_DIR, envs.FILE_UPLOAD_TMP_FOLDER),
    useTempFiles: true,
    safeFileNames: true,
    preserveExtension: false,
    responseOnLimit: JSON.stringify(createError(Errors.FILE_SIZE_TOO_LARGE)),
    // tempFileDir
  }),
);
router.use((req, res, next) => {
  if (!req.files) return next();
  for (const key in req.files) {
    const fileArr = Array.isArray(req.files[key])
      ? (req.files[key] as fileUpload.UploadedFile[])
      : ([req.files[key]] as fileUpload.UploadedFile[]);
    if (fileArr.length > 7) {
      return res.status(BAD_REQUEST).json(createError(Errors.TOO_MANY_FILES));
    }
    for (const f of fileArr) {
      if (f.size > 300 * 1024 * 1024) {
        logger.debug(
          "Tried to upload file too large: " +
            f.name +
            ", size: " +
            f.size +
            " bytes",
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
router.use("/adif", adifRoutes);
router.use("/counter", counterRoutes);
router.use("/post", postRoutes);
router.use("/comment", commentRoutes);
router.use("/qso", qsoRoutes);
router.use("/eqsl", eqslRoutes);
router.use("/document", documentRoutes);
router.use("/rankings", rankingsRoutes);
router.use("/beacon", beaconRoutes);
router.use("/location", locationRoutes);
router.use("/autocomplete", autocompleteRoutes);
router.use("/blog", blogRoutes);
router.use("/backup", backupRoutes);
router.use("/map", mapRoutes);
router.use("/logs", logsRoute);

router.use(errorHandler);
router.use(notFound);

export default router;
