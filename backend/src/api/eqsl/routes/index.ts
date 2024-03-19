import { Router } from "express";

import createRoute from "./create";
import forceSendRoute from "./forceSend";
import previewRoute from "./preview";

const router = Router();

router.use("/", createRoute);
router.use("/forcesend", forceSendRoute);
router.use("/preview", previewRoute);

export default router;
