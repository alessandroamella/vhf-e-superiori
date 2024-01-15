import { Router } from "express";
import isLoggedIn from "../../middlewares/isLoggedIn";
import isVerified from "../../middlewares/isVerified";

import createRoute from "./create";
import deleteRoute from "./delete";

const router = Router();

router.use("/", isLoggedIn, isVerified, createRoute);
router.use("/", isLoggedIn, isVerified, deleteRoute);

export default router;
