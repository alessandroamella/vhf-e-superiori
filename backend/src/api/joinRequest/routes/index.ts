import { Router } from "express";
import isAdmin from "../../middlewares/isAdmin";
import isLoggedIn from "../../middlewares/isLoggedIn";
import allRoute from "./all";
import approveRoute from "./approve";
import createRoute from "./create";
import deleteRoute from "./delete";
import eventRoute from "./event";
import eventAdminRoute from "./eventAdmin";

const router = Router();

router.use("/", isLoggedIn, createRoute);
router.use("/", isLoggedIn, deleteRoute);
router.use("/event", isLoggedIn, eventRoute);
router.use("/", isLoggedIn, allRoute);
router.use("/eventadmin", isAdmin, eventAdminRoute);
router.use("/", isAdmin, approveRoute);

export default router;
