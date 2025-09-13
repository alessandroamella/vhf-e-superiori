import { NextFunction, Request, Response } from "express";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "http-status";
import { envs, logger } from "../../shared";
import { Errors } from "../errors";
import { createError } from "../helpers";

interface TurnstileResponse {
  success: boolean;
  challenge_ts: string;
  hostname: string;
  "error-codes": string[];
  action?: string;
  cdata?: string;
  metadata?: {
    ephemeral_id: string;
  };
}

/**
 * Validates Cloudflare Turnstile token
 */
async function validateTurnstileToken(
  token: string,
  remoteip?: string,
): Promise<TurnstileResponse> {
  if (!token || typeof token !== "string") {
    return {
      success: false,
      challenge_ts: "",
      hostname: "",
      "error-codes": ["invalid-input-response"],
    };
  }

  if (token.length > 2048) {
    return {
      success: false,
      challenge_ts: "",
      hostname: "",
      "error-codes": ["invalid-input-response"],
    };
  }

  try {
    const formData = new FormData();
    formData.append("secret", envs.TURNSTILE_SECRET);
    formData.append("response", token);

    if (remoteip) {
      formData.append("remoteip", remoteip);
    }

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(10000), // 10 second timeout
      },
    );

    const result = await response.json();
    return result;
  } catch (error) {
    logger.error("Turnstile validation error:", error);
    return {
      success: false,
      challenge_ts: "",
      hostname: "",
      "error-codes": ["internal-error"],
    };
  }
}

/**
 * Expects "token" as a valid body (string) param
 * Validates Cloudflare Turnstile token
 */
async function checkCaptcha(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<undefined | Response> {
  try {
    // if admin, skip
    if (req.user?.isAdmin) {
      next();
      return;
    }

    const token = req.body.token;
    const ip =
      (req.headers["cf-connecting-ip"] as string) ||
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      req.ip;

    logger.debug("Validating Turnstile token");

    const validation = await validateTurnstileToken(token, ip);

    if (!validation.success) {
      logger.debug("Turnstile validation failed:", validation["error-codes"]);
      return res.status(BAD_REQUEST).json(createError(Errors.CAPTCHA_FAILED));
    }

    // Check token age (warn if older than 4 minutes)
    const challengeTime = new Date(validation.challenge_ts);
    const now = new Date();
    const ageMinutes = (now.getTime() - challengeTime.getTime()) / (1000 * 60);

    if (ageMinutes > 4) {
      logger.warn(`Turnstile token is ${ageMinutes.toFixed(1)} minutes old`);
    }

    logger.debug("Turnstile validation successful", {
      hostname: validation.hostname,
      action: validation.action,
      tokenAge: ageMinutes,
    });

    next();
  } catch (err) {
    logger.error("Error in Turnstile verification");
    logger.error(err);
    return res.status(INTERNAL_SERVER_ERROR).json(createError());
  }
}
export default checkCaptcha;
