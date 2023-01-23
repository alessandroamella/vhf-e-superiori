import { Router } from "express";

import createRoute from "./create";
import deleteRoute from "./delete";
import eventRoute from "./event";
import allRoute from "./all";
import approveRoute from "./approve";
import isAdmin from "../../middlewares/isAdmin";
import isLoggedIn from "../../middlewares/isLoggedIn";

const router = Router();

router.use("/", isLoggedIn, createRoute);
router.use("/", isLoggedIn, deleteRoute);
router.use("/", isLoggedIn, eventRoute);
router.use("/", isLoggedIn, allRoute);
router.use("/", isAdmin, approveRoute);

export default router;
