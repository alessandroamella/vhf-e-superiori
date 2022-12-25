import { ErrorRequestHandler } from "express";
import { BAD_REQUEST } from "http-status";
import { logger } from "../../shared/logger";
import { Errors } from "../errors";
import { createError } from "../helpers";

const checkMalformedBody: ErrorRequestHandler = (err, req, res, next) => {
    if (err instanceof SyntaxError && "body" in err) {
        logger.debug("Malformed body error");
        logger.debug(err);
        return res
            .status(BAD_REQUEST)
            .json(createError(Errors.MALFORMED_REQUEST_BODY));
    }
    next();
};
export default checkMalformedBody;
