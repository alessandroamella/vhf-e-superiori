import { Router } from "express";
import privacyRoute from "./privacy";
import tosRoute from "./tos";

const router = Router();

router.use("/tos", tosRoute);
router.use("/privacy", privacyRoute);

export default router;
