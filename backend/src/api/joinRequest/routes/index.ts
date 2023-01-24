import { Router } from "express";

import createRoute from "./create";
import deleteRoute from "./delete";
import eventRoute from "./event";
import eventAdminRoute from "./eventAdmin";
import allRoute from "./all";
import approveRoute from "./approve";
import isAdmin from "../../middlewares/isAdmin";
import isLoggedIn from "../../middlewares/isLoggedIn";

const router = Router();

router.use("/", isLoggedIn, createRoute);
router.use("/", isLoggedIn, deleteRoute);
router.use("/event", isLoggedIn, eventRoute);
router.use("/", isLoggedIn, allRoute);
router.use("/eventadmin", isAdmin, eventAdminRoute);
router.use("/", isAdmin, approveRoute);

export default router;
