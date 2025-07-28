import { Router } from "express";
import isAdmin from "../../middlewares/isAdmin";
import allRoute from "./all";
import createRoute from "./create";
import deleteRoute from "./delete";
import getRoute from "./get";
import updateRoute from "./update";
import uploadRoute from "./upload";

const router = Router();

router.use("/", getRoute);
router.use("/", allRoute);
router.use("/", isAdmin, createRoute);
router.use("/", isAdmin, updateRoute);
router.use("/", isAdmin, deleteRoute);
router.use("/upload", isAdmin, uploadRoute);

export default router;
