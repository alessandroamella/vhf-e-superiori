import { Router } from "express";
import isAdmin from "../../middlewares/isAdmin";
import isLoggedIn from "../../middlewares/isLoggedIn";
import allRoute from "./all";
import approveRoute from "./approve";
import createRoute from "./create";
import deleteRoute from "./delete";
import getRoute from "./get";
import updateRoute from "./update";

const router = Router();

router.use("/", allRoute);
router.use("/", getRoute);
router.use("/", isLoggedIn, createRoute);
router.use("/", isLoggedIn, updateRoute);
router.use("/", isLoggedIn, isAdmin, deleteRoute);
router.use("/approve", isLoggedIn, isAdmin, approveRoute);

export default router;
