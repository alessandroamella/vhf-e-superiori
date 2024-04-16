import { Router } from "express";

import getRoute from "./get";
import allRoute from "./all";
import createRoute from "./create";
import deleteRoute from "./delete";

const router = Router();

router.use("/", getRoute);
router.use("/", allRoute);
router.use("/", createRoute);
router.use("/", deleteRoute);

export default router;
