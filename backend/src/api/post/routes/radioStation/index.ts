import { Router } from "express";

import createRoute from "./create";
import isLoggedIn from "../../../middlewares/isLoggedIn";
import isVerified from "../../../middlewares/isVerified";

const router = Router();

router.use("/", isLoggedIn, isVerified, createRoute);

export default router;
