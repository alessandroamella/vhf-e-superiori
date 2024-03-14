import { Router } from "express";
import isLoggedIn from "../../middlewares/isLoggedIn";
import isVerified from "../../middlewares/isVerified";

import allRoute from "./all";
import createRoute from "./create";
import getRoute from "./get";
import deleteRoute from "./delete";

const router = Router();

router.use("/", allRoute);
router.use("/", getRoute);
router.use("/", isLoggedIn, isVerified, createRoute);
router.use("/", isLoggedIn, isVerified, deleteRoute);

export default router;
