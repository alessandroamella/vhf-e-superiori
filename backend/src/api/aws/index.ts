import AWS from "aws-sdk";
import fs from "fs";
import { envs } from "../../shared";

const s3 = new AWS.S3({
    accessKeyId: envs.AWS_ACCESS_KEY_ID,
    secretAccessKey: envs.AWS_SECRET_ACCESS_KEY
});

//   to upload a file
const fileName = "the-file-name";
const fileContent = fs.readFileSync(fileName);

const params = {
    Bucket: envs.AWS_BUCKET_NAME,
    Key: `${fileName}.jpg`,
    Body: fileContent
};

s3.upload(params, async (err: Error, data: AWS.S3.ManagedUpload.SendData) => {
    if (err) {
        // reject(err);
    }
    // do stuff
    data.Location;
});
