import AWS from "aws-sdk";
import moment from "moment";
import mime from "mime-types";
import { envs } from "../../shared";

const s3 = new AWS.S3({
    accessKeyId: envs.AWS_ACCESS_KEY_ID,
    secretAccessKey: envs.AWS_SECRET_ACCESS_KEY
});

/**
 * Represents a file to be uploaded to an S3 bucket.
 * @interface S3FileUpload
 */
interface S3FileUpload {
    /**
     * The name of the file.
     * @type {string}
     */
    fileName: string;
    /**
     * The contents of the file.
     * @type {Buffer}
     */
    fileContent: Buffer;
    /**
     * The name of the bucket to upload the file to.
     * @type {string | undefined}
     */
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
        return `${userId}-${moment().valueOf()}.${mime.extension(mimeType)}`;
    }

    /**
     * @param {S3FileUpload}
     * @returns {string} The location of the uploaded file
     */
    uploadFile({
        fileName,
        fileContent,
        bucket
    }: S3FileUpload): Promise<string> {
        return new Promise((resolve, reject) => {
            s3.upload(
                {
                    Bucket: bucket || envs.AWS_BUCKET_NAME,
                    Key: fileName,
                    Body: fileContent
                },
                (err: Error, data: AWS.S3.ManagedUpload.SendData) => {
                    if (err) return reject(err);
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
}
