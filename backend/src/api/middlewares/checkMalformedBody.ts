import { ErrorRequestHandler } from "express";
import { logger } from "../../shared/logger";
import { Errors } from "../errors";

const checkMalformedBody: ErrorRequestHandler = (err, req, res, next) => {
    if (err instanceof SyntaxError && "body" in err) {
        logger.debug("Malformed body error");
        logger.debug(err);

        return next(new Error(Errors.MALFORMED_REQUEST_BODY));
    }
    next();
};
export default checkMalformedBody;
