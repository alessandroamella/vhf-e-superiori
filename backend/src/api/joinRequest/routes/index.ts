import { Router } from "express";

import createRoute from "./create";
import approveRoute from "./approve";
import deleteRoute from "./delete";
import isAdmin from "../../middlewares/isAdmin";

const router = Router();

router.use("/", createRoute);
router.use("/", deleteRoute);
router.use("/", isAdmin, approveRoute);

export default router;
