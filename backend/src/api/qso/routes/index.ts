import { Router } from "express";
import isLoggedIn from "../../middlewares/isLoggedIn";
import allRoute from "./all";
import changeLocatorRoute from "./changeLocator";
import createRoute from "./create";
import deleteRoute from "./delete";
import getRoute from "./get";

const router = Router();

router.use("/", getRoute);
router.use("/", allRoute);
router.use("/", isLoggedIn, allRoute);
router.use("/", isLoggedIn, createRoute);
router.use("/", isLoggedIn, deleteRoute);
router.use("/", isLoggedIn, changeLocatorRoute);

export default router;
