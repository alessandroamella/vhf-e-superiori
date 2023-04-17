import { CronJob } from "cron";
import moment from "moment";
import { logger } from "../../shared";
import { s3Client } from "../aws";
import Post from "../post/models";

export const cleanUnusedFilesJob = new CronJob(
    "0 1 * * *",
    async function () {
        logger.info("Running Cron Job to delete unused files on AWS S3");

        const missingFromAws: string[] = [];
        const unusedInAws: string[] = [];

        try {
            const _s3Pics = await s3Client.listFiles({ folder: "pics" });
            const _s3Vids = await s3Client.listFiles({ folder: "vids" });

            // Get files created more than 1 day ago
            const s3Pics = _s3Pics.Contents?.filter(
                c => moment().diff(moment(c.LastModified), "days") > 1
            )
                .map(c => c.Key)
                .filter((f): f is string => typeof f === "string");

            const s3Vids = _s3Vids.Contents?.filter(
                c => moment().diff(moment(c.LastModified), "days") > 1
            )
                .map(c => c.Key)
                .filter((f): f is string => typeof f === "string");

            if (!s3Pics || !s3Vids) {
                logger.error(
                    "Error while listing files in AWS S3 in cleanUnusedFilesJob"
                );
                return;
            }

            // Find all posts created more than 1 week ago
            // const posts = await Post.find({
            //     createdAt: { $lt: moment().subtract(1, "week").toDate() }
            // }).select("pictures videos");

            // above is wrong, it's the opposite of what we want
            const posts = await Post.find({}).select("pictures videos");

            const pics = [...new Set(posts.map(p => p.pictures).flat())];
            const vids = [...new Set(posts.map(p => p.videos).flat())];

            logger.info("cleanUnusedFilesJob");
            logger.info("S3 vics:");
            logger.info(s3Pics);
            logger.info("S3 vids");
            logger.info(s3Pics);
            logger.info("Posts pics:");
            logger.info(pics);
            logger.info("Posts vids");
            logger.info(vids);

            for (const p of [...pics, ...vids]) {
                if (
                    !s3Pics.find(f => p.includes(f)) &&
                    !s3Vids.find(f => p.includes(f))
                ) {
                    logger.warn(`File not found in AWS S3: ${p}`);
                    missingFromAws.push(p);
                }
            }
            for (const f of s3Pics) {
                if (!pics.find(p => p.includes(f))) {
                    logger.warn(`Picture not found in posts: ${f}`);
                    unusedInAws.push(f);
                }
            }
            for (const f of s3Vids) {
                if (!vids.find(p => p.includes(f))) {
                    logger.warn(`Video not found in posts: ${f}`);
                    unusedInAws.push(f);
                }
            }
        } catch (err) {
            logger.error("Error while finding files in Cron job");
            logger.error(err);
        }

        try {
            if (missingFromAws.length > 0) {
                logger.error("Files missing from AWS:");
                logger.error(missingFromAws);
                // logger.warn("Pulling missing files from posts:");
                // logger.warn(missingFromAws);
                // await Post.updateMany(
                //     {},
                //     {
                //         $pull: {
                //             pictures: { $in: missingFromAws },
                //             videos: { $in: missingFromAws }
                //         }
                //     }
                // );
                logger.info("Missing files pulled successfully");
            } else {
                logger.info("No files to pull from posts");
            }
        } catch (err) {
            logger.error("Error while pulling missing files from posts");
            logger.error(err);
        }
        try {
            if (unusedInAws.length > 0) {
                logger.warn("Deleting unused files in AWS:");
                logger.warn(unusedInAws);

                await s3Client.deleteMultiple({
                    filePaths: unusedInAws
                });
                logger.info("Unused files deleted successfully");
            } else {
                logger.info("No files to delete from AWS");
            }
        } catch (err) {
            logger.error("Error while deleting unused files from AWS");
            logger.error(err);
        }

        logger.info("Cron Job to delete unused files on AWS S3 completed");
    },
    null,
    false,
    "Europe/Rome"
);
