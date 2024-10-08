import { Router } from "express";

import allRoute from "./all";
import getRoute from "./get";
import createRoute from "./create";
import deleteRoute from "./delete";
import changeLocatorRoute from "./changeLocator";

import isLoggedIn from "../../middlewares/isLoggedIn";

const router = Router();

router.use("/", getRoute);
router.use("/", allRoute);
router.use("/", isLoggedIn, allRoute);
router.use("/", isLoggedIn, createRoute);
router.use("/", isLoggedIn, deleteRoute);
router.use("/", isLoggedIn, changeLocatorRoute);

export default router;
