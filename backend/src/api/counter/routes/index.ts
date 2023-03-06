import { Router } from "express";

import getRoute from "./get";
import createRoute from "./create";

const router = Router();

router.use("/", getRoute);
router.use("/", createRoute);

export default router;
