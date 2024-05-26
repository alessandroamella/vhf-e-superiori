import { DocumentType, getModelForClass } from "@typegoose/typegoose";
import { UserClass } from "./User";

export const User = getModelForClass(UserClass);

export { UserClass } from "./User";
export type UserDoc = DocumentType<UserClass>;
