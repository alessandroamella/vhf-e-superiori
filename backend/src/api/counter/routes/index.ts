import { Router } from "express";
import createRoute from "./create";
import getRoute from "./get";

const router = Router();

router.use("/", getRoute);
router.use("/", createRoute);

export default router;
