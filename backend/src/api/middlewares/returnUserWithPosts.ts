import { NextFunction, Request, Response } from "express";
import { INTERNAL_SERVER_ERROR, UNAUTHORIZED } from "http-status";
import { logger } from "../../shared";
import User, { UserDoc } from "../auth/models";
import { Errors } from "../errors";
import { createError } from "../helpers";

async function returnUserWithPosts(
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction
) {
    if (!req.user) {
        throw new Error("No req.user in returnUserWithPosts middleware");
    }
    try {
        const user = await User.findOne(
            { _id: (req.user as unknown as UserDoc)._id },
            {
                password: 0,
                joinRequests: 0,
                verificationCode: 0,
                passwordResetCode: 0,
                __v: 0
            }
        )
            .populate("posts", ["description", "isApproved", "createdAt"])
            .lean();
        if (!user) {
            return res
                .status(UNAUTHORIZED)
                .json(createError(Errors.NOT_LOGGED_IN));
        }
        user.posts?.reverse();
        logger.debug("User view");
        logger.debug(JSON.stringify(user));
        res.json(user);
    } catch (err) {
        logger.error("Error in user view");
        logger.error(err);
        res.status(INTERNAL_SERVER_ERROR).json(createError());
    }
}
export default returnUserWithPosts;
