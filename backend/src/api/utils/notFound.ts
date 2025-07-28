import { Router } from "express";
import { NOT_FOUND } from "http-status";
import { Errors } from "../errors";
import { createError } from "../helpers";

const router = Router();

router.use("*", (_req, res) =>
  res.status(NOT_FOUND).json(createError(Errors.URL_NOT_FOUND)),
);

export default router;
