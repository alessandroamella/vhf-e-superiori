import { Router } from "express";
import tosRoute from "./tos";
import privacyRoute from "./privacy";

const router = Router();

router.use("/tos", tosRoute);
router.use("/privacy", privacyRoute);

export default router;
