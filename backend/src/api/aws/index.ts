import { readFile, unlink } from "node:fs/promises";
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client as S3ClientV3,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import mime from "mime-types";
import moment from "moment";
import randomstring from "randomstring";
import { envs, logger } from "../../shared";

const s3 = new S3ClientV3({
  credentials: {
    accessKeyId: envs.AWS_ACCESS_KEY_ID,
    secretAccessKey: envs.AWS_SECRET_ACCESS_KEY,
  },
  region: envs.AWS_REGION, // Add region configuration
});

/**
 * Represents a file to be uploaded to an S3 bucket.
 * @interface S3FileUpload
 */
export interface S3FileUpload {
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

interface S3GetFileMeta {
  filePath: string;
  bucket?: string;
}

interface S3GetFile {
  filePath: string;
  bucket?: string;
}

interface S3ListFiles {
  folder?: string;
  bucket?: string;
}

export class S3Client {
  generateFileName({ mimeType, userId }: S3GenerateFileName): string {
    return `${userId}-${moment().valueOf()}-${randomstring.generate({
      length: 16,
      charset: "hex",
    })}.${mime.extension(mimeType)}`;
  }

  /**
   * @param {Omit<S3FileUpload, "fileContent"> & {filePath: string}} param0
   * @returns {string} The location of the uploaded file
   */
  async uploadFile({
    fileName,
    filePath,
    folder,
    mimeType,
    bucket,
  }: Omit<S3FileUpload, "fileContent"> & {
    filePath: string;
  }): Promise<string> {
    const fileContent = await readFile(filePath);
    const bucketName = bucket || envs.AWS_BUCKET_NAME;
    const key = `${folder}/${fileName}`;

    const params = {
      Bucket: bucketName,
      Key: key,
      Body: fileContent,
      ContentType: mimeType,
    };

    const command = new PutObjectCommand(params);

    try {
      await s3.send(command);
      const fileLocation = `https://${bucketName}.s3.${envs.AWS_REGION}.amazonaws.com/${key}`;
      logger.debug(`Uploaded file to location ${fileLocation}`);
      // Delete temp file
      await this._deleteTempFile({ filePath });
      return fileLocation;
    } catch (err) {
      logger.error("Error uploading file to S3");
      logger.error(err);
      throw err; // Re-throw the error to be handled by the caller
    }
  }

  private async _deleteTempFile({
    filePath,
  }: {
    filePath: string;
  }): Promise<boolean> {
    logger.debug(`Deleting temp file at ${filePath}`);
    try {
      await unlink(filePath);
      return true;
    } catch (err) {
      logger.error("Error deleting temp file");
      logger.error(err);
      return false;
    }
  }

  async deleteFile({ filePath, bucket }: S3FileDelete): Promise<void> {
    const bucketName = bucket || envs.AWS_BUCKET_NAME;
    const params = {
      Bucket: bucketName,
      Key: filePath,
    };
    const command = new DeleteObjectCommand(params);
    try {
      await s3.send(command);
      logger.debug(`Deleted file from S3 at path ${filePath}`);
    } catch (err) {
      logger.error("Error deleting file from S3");
      logger.error(err);
      throw err;
    }
  }

  async deleteMultiple({
    filePaths,
    bucket,
  }: {
    filePaths: string[];
    bucket?: string;
  }): Promise<void> {
    const bucketName = bucket || envs.AWS_BUCKET_NAME;
    const Objects = filePaths.map((fp) => ({ Key: fp }));
    logger.debug("Deleting files from S3");
    logger.debug(Objects);

    const params = {
      Bucket: bucketName,
      Delete: {
        Objects: Objects,
      },
    };
    const command = new DeleteObjectsCommand(params);
    try {
      await s3.send(command);
      logger.debug(`Deleted multiple files from S3`);
    } catch (err) {
      logger.error("Error deleting multiple files from S3");
      logger.error(err);
      throw err;
    }
  }

  async getFileMeta({
    filePath,
    bucket,
  }: S3GetFileMeta): Promise<import("@aws-sdk/client-s3").HeadObjectOutput> {
    const bucketName = bucket || envs.AWS_BUCKET_NAME;
    const params = {
      Bucket: bucketName,
      Key: filePath,
    };
    const command = new HeadObjectCommand(params);
    try {
      const data = await s3.send(command);
      return data;
    } catch (err) {
      logger.error(`Error getting file metadata for ${filePath} from S3`);
      logger.error(err);
      throw err;
    }
  }

  async getFile({ filePath, bucket }: S3GetFile): Promise<Buffer | undefined> {
    const bucketName = bucket || envs.AWS_BUCKET_NAME;
    const params = {
      Bucket: bucketName,
      Key: filePath,
    };
    const command = new GetObjectCommand(params);
    try {
      const data = await s3.send(command);
      if (data.Body) {
        const bodyContent = await data.Body.transformToByteArray();
        return Buffer.from(bodyContent);
      } else {
        return undefined;
      }
    } catch (err) {
      logger.error(`Error getting file ${filePath} from S3`);
      logger.error(err);
      throw err;
    }
  }

  async listFiles({
    folder,
    bucket,
  }: S3ListFiles): Promise<import("@aws-sdk/client-s3").ListObjectsV2Output> {
    const bucketName = bucket || envs.AWS_BUCKET_NAME;
    const params = {
      Bucket: bucketName,
      Prefix: folder,
    };
    const command = new ListObjectsV2Command(params);
    try {
      const data = await s3.send(command);
      return data;
    } catch (err) {
      logger.error(`Error listing files in folder ${folder} from S3`);
      logger.error(err);
      throw err;
    }
  }

  /**
   * Generates a signed URL for accessing a private S3 object.
   * @param {S3GetFile} params - Parameters including filePath and optional bucket.
   * @param {number} [expiresIn=3600] - Expiration time for the signed URL in seconds (default: 1 hour).
   * @returns {Promise<string>} - Resolves with the signed URL.
   */
  async getSignedUrl(
    { filePath, bucket }: S3GetFile,
    expiresIn: number = 3600,
  ): Promise<string> {
    const bucketName = bucket || envs.AWS_BUCKET_NAME;
    const params = {
      Bucket: bucketName,
      Key: filePath,
    };
    const command = new GetObjectCommand(params);

    try {
      const url = await getSignedUrl(s3, command, { expiresIn });
      return url;
    } catch (error) {
      logger.error(`Error generating signed URL for ${filePath} from S3`);
      logger.error(error);
      throw error;
    }
  }
}

export const s3Client = new S3Client();
