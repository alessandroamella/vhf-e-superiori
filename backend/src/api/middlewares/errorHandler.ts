import { ErrorRequestHandler } from "express";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "http-status";
import { logger } from "../../shared/logger";
import { Errors } from "../errors";
import { createError } from "../helpers";

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let isUserError =
    err instanceof (Error as never) &&
    err.message in Errors &&
    ![Errors.SERVER_ERROR, Errors.UNKNOWN_ERROR].includes(err.message);

  if (err instanceof SyntaxError && "body" in err) {
    logger.debug("Malformed body error");
    logger.debug(err);
    isUserError = true;
    err.message = Errors.MALFORMED_REQUEST_BODY;
  }

  if (isUserError) {
    logger.debug("Express request handler user error");
    logger.debug(err);
  } else {
    logger.error("Express request handler server error");
    logger.error(err);
  }

  res
    .status(isUserError ? BAD_REQUEST : INTERNAL_SERVER_ERROR)
    .json(createError(isUserError ? err.message : Errors.UNKNOWN_ERROR));
};
export default errorHandler;
