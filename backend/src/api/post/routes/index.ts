import { Router } from "express";
import isLoggedIn from "../../middlewares/isLoggedIn";
import isVerified from "../../middlewares/isVerified";

import allRoute from "./all";
import approveRoute from "./approve";
import getRoute from "./get";
import deleteRoute from "./delete";
import uploadFilesRoute from "./upload";
import uploadStatusRoute from "./uploadStatus";

import antennaRoute from "./antenna";
import myFlashMobRoute from "./myFlashMob";
import radioStationRoute from "./radioStation";

const router = Router();

router.use("/antenna", isLoggedIn, isVerified, antennaRoute);
router.use("/myflashmob", isLoggedIn, isVerified, myFlashMobRoute);
router.use("/radiostation", isLoggedIn, isVerified, radioStationRoute);

router.use("/", allRoute);
router.use("/approve", approveRoute);
router.use("/", getRoute);
router.use("/", isLoggedIn, isVerified, deleteRoute);
router.use("/upload", isLoggedIn, isVerified, uploadFilesRoute);
router.use("/uploadstatus", isLoggedIn, isVerified, uploadStatusRoute);

export default router;
