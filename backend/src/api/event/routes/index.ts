import { Router } from "express";

import allRoute from "./all";
import viewRoute from "./view";
import createRoute from "./create";
import updateRoute from "./update";
import deleteRoute from "./delete";

const router = Router();

router.use("/", allRoute);
router.use("/", viewRoute);
router.use("/", createRoute);
router.use("/", updateRoute);
router.use("/", deleteRoute);

export default router;
