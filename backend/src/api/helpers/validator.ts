import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { BAD_REQUEST } from "http-status";
import { createError } from ".";

export const validate = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }

    return res
        .status(BAD_REQUEST)
        .json(
            createError([...new Set(errors.array().map(e => e.param))].join())
        );
};
