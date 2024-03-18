import { Router } from "express";

import allRoute from "./all";
import getRoute from "./get";
import createRoute from "./create";
import updateRoute from "./update";
import deleteRoute from "./delete";
import isLoggedIn from "../../middlewares/isLoggedIn";
import isAdmin from "../../middlewares/isAdmin";

const router = Router();

router.use("/", allRoute);
router.use("/", getRoute);
router.use("/", isLoggedIn, createRoute);
router.use("/", isLoggedIn, updateRoute);
router.use("/", isLoggedIn, isAdmin, deleteRoute);

export default router;
