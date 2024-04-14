import { Router, Response } from "express";
import loginRoute from "./login";
import signupRoute from "./signup";
import logoutRoute from "./logout";
import viewRoute from "./view";
import getRoute from "./get";
import verifyRoute from "./verify";
import updateRoute from "./update";
import changePwRoute from "./changePw";
import sendResetPwRoute from "./sendResetPw";
import resetPwRoute from "./resetPw";
import adminsRoute from "./admins";
import allRoute from "./all";
import { AuthOptions } from "../shared";
import { logger } from "../../../shared";
import isLoggedIn from "../../middlewares/isLoggedIn";
import isAdmin from "../../middlewares/isAdmin";
const router = Router();

logger.debug("Using auth routes");

export const saveToken = (res: Response, token: string) => {
    res.cookie(AuthOptions.AUTH_COOKIE_NAME, token, {
        signed: true,
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 3
    });
};

router.use("/login", loginRoute);
router.use("/signup", signupRoute);
router.use("/logout", logoutRoute);
router.use("/verify", verifyRoute);
router.use("/sendresetpw", sendResetPwRoute);
router.use("/resetpw", resetPwRoute);
router.use("/changepw", isLoggedIn, changePwRoute);
router.use("/admins", adminsRoute);
router.use("/all", isLoggedIn, isAdmin, allRoute);
router.use("/", getRoute);
router.use("/", isLoggedIn, viewRoute);
router.use("/", isLoggedIn, updateRoute);

export default router;
