import { Router } from "express";
import isLoggedIn from "../../middlewares/isLoggedIn";
import isVerified from "../../middlewares/isVerified";

import allRoute from "./all";
import approveRoute from "./approve";
import createRoute from "./create";
import getRoute from "./get";
import deleteRoute from "./delete";
import uploadFilesRoute from "./upload";
import uploadStatusRoute from "./uploadStatus";
import isAdmin from "../../middlewares/isAdmin";

const router = Router();

router.use("/", allRoute);
router.use("/approve", isLoggedIn, isVerified, isAdmin, approveRoute);
router.use("/", isLoggedIn, isVerified, createRoute);
router.use("/", getRoute);
router.use("/", isLoggedIn, isVerified, deleteRoute);
router.use("/upload", isLoggedIn, isVerified, uploadFilesRoute);
router.use("/uploadstatus", isLoggedIn, isVerified, uploadStatusRoute);

export default router;
