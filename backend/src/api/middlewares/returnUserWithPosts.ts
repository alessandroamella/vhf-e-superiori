import { NextFunction, Request, Response } from "express";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, UNAUTHORIZED } from "http-status";
import { logger } from "../../shared";
import { User, UserDoc } from "../auth/models";
import { Errors } from "../errors";
import { createError } from "../helpers";
import { BasePost } from "../post/models";
import moment from "moment";
import { BasePostClass } from "../post/models/BasePost";
import { Qso } from "../qso/models";
import { QsoClass } from "../qso/models/Qso";
import { qrz } from "../qrz";
import { location } from "../location";

async function returnUserWithPosts(
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction,
    callsign?: string,
    _id?: string
) {
    // const callsign = undefined;
    // const _id = undefined;
    logger.debug("returnUserWithPosts middleware");
    if (!req.user) {
        throw new Error("No req.user in returnUserWithPosts middleware");
    }
    try {
        const user = await User.findOne(
            callsign
                ? { callsign }
                : { _id: _id || (req.user as unknown as UserDoc)._id },
            {
                password: 0,
                joinRequests: 0,
                verificationCode: 0,
                passwordResetCode: 0,
                __v: 0
            }
        ).lean();
        if (!user) {
            logger.debug("User not found in user view");
            if (callsign) {
                return res
                    .status(BAD_REQUEST)
                    .json(createError(Errors.USER_NOT_FOUND));
            } else {
                return res
                    .status(UNAUTHORIZED)
                    .json(createError(Errors.NOT_LOGGED_IN));
            }
        }

        const posts = await BasePost.find(
            {
                fromUser: user._id,
                isProcessing: false,
                hidden: false
            },
            {
                fromUser: 0,
                isProcessing: 0,
                __v: 0
            }
        ).lean();

        const _qsos = await Qso.find(
            {
                $or: [{ fromStation: user._id }, { callsign: user.callsign }]
            },
            {
                emailSent: 0,
                emailSentDate: 0,
                __v: 0
            }
        )
            .populate({
                path: "event",
                select: "name band date"
            })
            .populate({
                path: "fromStation",
                select: "callsign"
            })
            .sort({ createdAt: -1 })
            .sort({ "event.date": -1 })
            .lean();

        const qsos = await Promise.all(
            _qsos.map(async e => ({
                ...e,
                fromLocator:
                    e.fromStationLat && e.fromStationLon
                        ? location.calculateQth(
                              e.fromStationLat,
                              e.fromStationLon
                          )
                        : undefined,
                toLocator:
                    e.toStationLat && e.toStationLon
                        ? location.calculateQth(e.toStationLat, e.toStationLon)
                        : undefined,
                isRegistered: await User.exists({ callsign: e.callsign })
            }))
        );

        // user.posts?.reverse();

        const qrzData = await qrz.getInfo(user.callsign);

        const _user: typeof user & {
            posts: BasePostClass[];
            pp?: string;
            qsos: QsoClass[];
        } = {
            ...user,
            pp: qrzData?.pictureUrl,
            posts,
            qsos
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
