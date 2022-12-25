import { Errors } from "../errors";

export function createError(err: Errors | string, additionalParams = {}) {
    return { err, ...additionalParams };
}
