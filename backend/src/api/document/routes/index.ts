import { Router } from "express";
import privacyRoute from "./privacy";

const router = Router();

router.use("/privacy", privacyRoute);

export default router;
