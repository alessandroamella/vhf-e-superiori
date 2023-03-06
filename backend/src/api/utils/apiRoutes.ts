import { Router } from "express";

import authRoutes from "../auth/routes";
import eventRoutes from "../event/routes";
import joinRequestRoutes from "../joinRequest/routes";
import qrzRoutes from "../qrz/routes";
import counterRoutes from "../counter/routes";

import errorHandler from "../middlewares/errorHandler";
import populateUser from "../middlewares/populateUser";

import morgan from "morgan";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import { LoggerStream } from "../../shared/logger";
import { envs } from "../../shared/envs";

const router = Router();

router.use(morgan("dev", { stream: new LoggerStream() }));

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

router.use(cookieParser(envs.COOKIE_SECRET));

router.use(populateUser);

router.use("/auth", authRoutes);
router.use("/event", eventRoutes);
router.use("/joinrequest", joinRequestRoutes);
router.use("/qrz", qrzRoutes);
router.use("/counter", counterRoutes);

router.use(errorHandler);

export default router;
