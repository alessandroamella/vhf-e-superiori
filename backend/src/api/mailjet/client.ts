import { Client } from "node-mailjet";
import { envs } from "../../shared";

export const mailjet = new Client({
  apiKey: envs.MAIL_USERNAME,
  apiSecret: envs.MAIL_PASSWORD,
});
