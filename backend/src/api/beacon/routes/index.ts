import { Router } from "express";

import allRoute from "./all";
import getRoute from "./get";
import createRoute from "./create";
import updateRoute from "./update";
import deleteRoute from "./delete";
import approveRoute from "./approve";

import isLoggedIn from "../../middlewares/isLoggedIn";
import isAdmin from "../../middlewares/isAdmin";

const router = Router();

router.use("/", allRoute);
router.use("/", getRoute);
router.use("/", isLoggedIn, createRoute);
router.use("/", isLoggedIn, updateRoute);
router.use("/", isLoggedIn, isAdmin, deleteRoute);
router.use("/approve", isLoggedIn, isAdmin, approveRoute);

export default router;
