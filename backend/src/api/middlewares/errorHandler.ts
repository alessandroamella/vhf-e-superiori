import { ErrorRequestHandler } from "express";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "http-status";
import { logger } from "../../shared/logger";
import { Errors } from "../errors";
import { createError } from "../helpers";

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    logger.error("Express request handler error");

    const isUserError =
        err instanceof (Error as any) &&
        err.message in Errors &&
        ![Errors.SERVER_ERROR, Errors.UNKNOWN_ERROR].includes(err.message);
    if (isUserError) {
        logger.debug(err);
    } else {
        logger.error(err);
    }

    res.status(isUserError ? BAD_REQUEST : INTERNAL_SERVER_ERROR).json(
        createError(isUserError ? err.message : Errors.UNKNOWN_ERROR)
    );
};
export default errorHandler;
