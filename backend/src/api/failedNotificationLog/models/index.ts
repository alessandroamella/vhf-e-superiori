import { DocumentType, getModelForClass } from "@typegoose/typegoose";
import { FailedNotificationLogClass } from "./FailedNotificationLog";

export const FailedNotificationLog = getModelForClass(
  FailedNotificationLogClass,
);

export { FailedNotificationLogClass } from "./FailedNotificationLog";
export type FailedNotificationLogDoc = DocumentType<FailedNotificationLogClass>;
