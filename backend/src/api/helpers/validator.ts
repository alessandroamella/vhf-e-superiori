import { NextFunction, Request, Response } from "express";
import { type FieldValidationError, validationResult } from "express-validator";
import { BAD_REQUEST } from "http-status";
import { pick, uniqWith } from "lodash";
import { logger } from "../../shared";
import { Errors } from "../errors";
import { createError } from ".";

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const errorsArray = errors.array() as FieldValidationError[];

  logger.debug("Validation errors: ");
  logger.debug(errorsArray);

  const formattedErrors = uniqWith(
    errorsArray.map((e) => pick(e, ["msg", "path"])),
    (e1, e2) =>
      e1.msg === e2.msg &&
      ("path" in e1 && "path" in e2 ? e1.path === e2.path : true),
  );

  return res
    .status(BAD_REQUEST)
    .json(createError(Errors.VALIDATION_ERROR, formattedErrors));
};
