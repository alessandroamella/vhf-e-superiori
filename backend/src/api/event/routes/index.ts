import { Router } from "express";

import allRoute from "./all";
import getRoute from "./get";
import createRoute from "./create";
import updateRoute from "./update";
import deleteRoute from "./delete";
import uploadRoute from "./upload";
import isAdmin from "../../middlewares/isAdmin";

const router = Router();

router.use("/", getRoute);
router.use("/", allRoute);
router.use("/", isAdmin, createRoute);
router.use("/", isAdmin, updateRoute);
router.use("/", isAdmin, deleteRoute);
router.use("/upload", isAdmin, uploadRoute);

export default router;
