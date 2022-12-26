import { Router } from "express";

import createRoute from "./create";
import updateRoute from "./update";
import deleteRoute from "./delete";

const router = Router();

router.use("/", createRoute);
router.use("/", updateRoute);
router.use("/", deleteRoute);

export default router;
