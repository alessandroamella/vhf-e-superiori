import { Router } from "express";

import createRoute from "./create";
import approveRoute from "./approve";
import deleteRoute from "./delete";

const router = Router();

router.use("/", createRoute);
router.use("/", deleteRoute);
router.use("/", approveRoute);

export default router;
