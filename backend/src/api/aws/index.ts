import AWS from "aws-sdk";
import moment from "moment";
import mime from "mime-types";
import randomstring from "randomstring";
import { envs, logger } from "../../shared";

const s3 = new AWS.S3({
    accessKeyId: envs.AWS_ACCESS_KEY_ID,
    secretAccessKey: envs.AWS_SECRET_ACCESS_KEY
});

/**
 * Represents a file to be uploaded to an S3 bucket.
 * @interface S3FileUpload
 */
interface S3FileUpload {
    fileName: string;
    fileContent: Buffer;
    folder: string;
    mimeType: string;
    bucket?: string;
}

interface S3GenerateFileName {
    userId: string;
    mimeType: string;
}

interface S3FileDelete {
    filePath: string;
    bucket?: string;
}

export class S3Client {
    generateFileName({ mimeType, userId }: S3GenerateFileName): string {
        return `${userId}-${moment().valueOf()}-${randomstring.generate({
            length: 16,
            charset: "hex"
        })}.${mime.extension(mimeType)}`;
    }

    /**
     * @param {S3FileUpload}
     * @returns {string} The location of the uploaded file
     */
    uploadFile({
        fileName,
        fileContent,
        folder,
        mimeType,
        bucket
    }: S3FileUpload): Promise<string> {
        return new Promise((resolve, reject) => {
            s3.upload(
                {
                    Bucket: bucket || envs.AWS_BUCKET_NAME,
                    Key: `${folder}/${fileName}`,
                    Body: fileContent,
                    ContentType: mimeType
                },
                (err: Error, data: AWS.S3.ManagedUpload.SendData) => {
                    if (err) return reject(err);
                    logger.debug(`Uploaded file to location ${data.Location}`);
                    return resolve(data.Location);
                }
            );
        });
    }

    deleteFile({ filePath, bucket }: S3FileDelete): Promise<void> {
        return new Promise((resolve, reject) => {
            s3.deleteObject(
                {
                    Bucket: bucket || envs.AWS_BUCKET_NAME,
                    Key: filePath
                },
                (err: Error) => {
                    if (err) return reject(err);
                    return resolve();
                }
            );
        });
    }

    deleteMultiple({
        filePaths,
        bucket
    }: {
        filePaths: string[];
        bucket?: string;
    }): Promise<void> {
        return new Promise((resolve, reject) => {
            const Objects = filePaths.map(fp => ({ Key: fp }));
            logger.debug("Deleting files from S3");
            logger.debug(Objects);
            s3.deleteObjects(
                {
                    Bucket: bucket || envs.AWS_BUCKET_NAME,
                    Delete: {
                        Objects: filePaths.map(fp => ({ Key: fp }))
                    }
                },
                (err: Error) => {
                    if (err) return reject(err);
                    return resolve();
                }
            );
        });
    }

    getFileMeta({
        filePath,
        bucket
    }: {
        filePath: string;
        bucket?: string;
    }): Promise<AWS.S3.HeadObjectOutput> {
        return new Promise((resolve, reject) => {
            s3.headObject(
                {
                    Bucket: bucket || envs.AWS_BUCKET_NAME,
                    Key: filePath
                },
                (err: Error, data: AWS.S3.HeadObjectOutput) => {
                    if (err) return reject(err);
                    return resolve(data);
                }
            );
        });
    }

    // DEBUG: TO BE IMPLEMENTED
    getFile({
        filePath,
        bucket
    }: {
        filePath: string;
        bucket?: string;
    }): Promise<AWS.S3.Body | undefined> {
        return new Promise((resolve, reject) => {
            s3.getObject(
                {
                    Bucket: bucket || envs.AWS_BUCKET_NAME,
                    Key: filePath
                },
                (err: Error, data: AWS.S3.GetObjectOutput) => {
                    if (err) return reject(err);
                    return resolve(data.Body);
                }
            );
        });
    }

    listFiles({
        folder,
        bucket
    }: {
        folder: string;
        bucket?: string;
    }): Promise<AWS.S3.ListObjectsOutput> {
        return new Promise((resolve, reject) => {
            s3.listObjectsV2(
                {
                    Bucket: bucket || envs.AWS_BUCKET_NAME,
                    Prefix: folder
                },
                (err: Error, data: AWS.S3.ListObjectsOutput) => {
                    if (err) return reject(err);
                    return resolve(data);
                }
            );
        });
    }
}

export const s3Client = new S3Client();
