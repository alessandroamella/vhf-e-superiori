import { Router } from "express";
import isAdmin from "../../middlewares/isAdmin";
import isLoggedIn from "../../middlewares/isLoggedIn";
import allRoute from "./all";
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

export default router;
