import { Router } from "express";
import isLoggedIn from "../../middlewares/isLoggedIn";
import isVerified from "../../middlewares/isVerified";

import allRoute from "./all";
import createRoute from "./create";
import uploadRoute from "./upload";

const router = Router();

router.use("/", allRoute);
router.use("/", isLoggedIn, isVerified, createRoute);
router.use("/upload", isLoggedIn, isVerified, uploadRoute);

export default router;
