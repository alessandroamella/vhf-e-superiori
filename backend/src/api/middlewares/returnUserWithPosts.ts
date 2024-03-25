import { NextFunction, Request, Response } from "express";
import { INTERNAL_SERVER_ERROR, UNAUTHORIZED } from "http-status";
import { logger } from "../../shared";
import { User, UserDoc } from "../auth/models";
import { Errors } from "../errors";
import { createError } from "../helpers";
import { BasePost } from "../post/models";
import moment from "moment";
import { BasePostClass } from "../post/models/BasePost";

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
        ).lean();
        if (!user) {
            return res
                .status(UNAUTHORIZED)
                .json(createError(Errors.NOT_LOGGED_IN));
        }

        const posts = await BasePost.find(
            {
                fromUser: user._id,
                isProcessing: false,
                hidden: false
            },
            {
                fromUser: 0,
                pictures: 0,
                videos: 0,
                isProcessing: 0,
                comments: 0,
                __v: 0
            }
        ).lean();

        // user.posts?.reverse();

        const _user: typeof user & { posts: BasePostClass[] } = {
            ...user,
            posts
        };

        // timestamps are present
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        _user.posts.sort((a: any, b: any) => {
            return moment(b.createdAt).diff(moment(a.createdAt));
        });

        logger.debug("User view");
        logger.debug(JSON.stringify(_user));
        res.json(_user);
    } catch (err) {
        logger.error("Error in user view");
        logger.error(err);
        res.status(INTERNAL_SERVER_ERROR).json(createError());
    }
}
export default returnUserWithPosts;
