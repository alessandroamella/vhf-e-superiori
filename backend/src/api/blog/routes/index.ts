import { Router } from "express";

import getRoute from "./get";
import allRoute from "./all";
import createRoute from "./create";
import deleteRoute from "./delete";
import isLoggedIn from "../../middlewares/isLoggedIn";
import isAdmin from "../../middlewares/isAdmin";

const router = Router();

router.use("/", getRoute);
router.use("/", allRoute);
router.use("/", isLoggedIn, isAdmin, createRoute);
router.use("/", isLoggedIn, isAdmin, deleteRoute);

export default router;
