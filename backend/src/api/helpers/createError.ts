import { Errors } from "../errors";

export function createError(err?: Errors | string, additionalParams = {}) {
    return { err: err || Errors.UNKNOWN_ERROR, ...additionalParams };
}
