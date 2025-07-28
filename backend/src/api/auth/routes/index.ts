import { Response, Router } from "express";
import { logger } from "../../../shared";
import isAdmin from "../../middlewares/isAdmin";
import isLoggedIn from "../../middlewares/isLoggedIn";
import { AuthOptions } from "../shared";
import adminsRoute from "./admins";
import allRoute from "./all";
import changePwRoute from "./changePw";
import getRoute from "./get";
import loginRoute from "./login";
import logoutRoute from "./logout";
import resetPwRoute from "./resetPw";
import sendResetPwRoute from "./sendResetPw";
import signupRoute from "./signup";
import updateRoute from "./update";
import verifyRoute from "./verify";
import viewRoute from "./view";

const router = Router();

logger.debug("Using auth routes");

export const saveToken = (res: Response, token: string) => {
  res.cookie(AuthOptions.AUTH_COOKIE_NAME, token, {
    signed: true,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 3,
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
