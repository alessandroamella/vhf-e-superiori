import { Router } from "express";
import isAdmin from "../../middlewares/isAdmin";
import isLoggedIn from "../../middlewares/isLoggedIn";
import allRoute from "./all";
import createRoute from "./create";
import deleteRoute from "./delete";
import getRoute from "./get";

const router = Router();

router.use("/", getRoute);
router.use("/", allRoute);
router.use("/", isLoggedIn, isAdmin, createRoute);
router.use("/", isLoggedIn, isAdmin, deleteRoute);

export default router;
