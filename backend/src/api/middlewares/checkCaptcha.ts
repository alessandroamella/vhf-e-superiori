/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { NextFunction, Request, Response } from "express";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, OK } from "http-status";
import { envs, logger } from "../../shared";
import { Errors } from "../errors";
import { createError } from "../helpers";

/**
 * Expects "token" as a valid body (string) param
 */
async function checkCaptcha(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void | Response> {
    try {
        const ip = req.socket.remoteAddress;
        logger.debug("Checking CAPTCHA to");
        logger.debug(
            `https://www.google.com/recaptcha/api/siteverify?secret=${
                envs.RECAPTCHA_SECRET
            }&response=${req.body.token}${ip ? "&remoteip=" + ip : ""}`
        );
        const res = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify?secret=${
                envs.RECAPTCHA_SECRET
            }&response=${req.body.token}${ip ? "&remoteip=" + ip : ""}`
        );
        if (res.status !== OK) throw new Error(Errors.CAPTCHA_FAILED);
        return next();
    } catch (err) {
        if (err instanceof Error && err.message === Errors.CAPTCHA_FAILED) {
            logger.debug("Captcha fail");
            logger.debug(err);
            return res
                .status(BAD_REQUEST)
                .json(createError(Errors.CAPTCHA_FAILED));
        }
        logger.error("Error in signup CAPTCHA verification");
        logger.error(err);
        return res.status(INTERNAL_SERVER_ERROR).json(createError());
    }
}
export default checkCaptcha;
