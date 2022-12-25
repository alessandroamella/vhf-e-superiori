import { DocumentType, getModelForClass } from "@typegoose/typegoose";
import { UserClass } from "./User";

const User = getModelForClass(UserClass);

export { UserClass } from "./User";
export type UserDoc = DocumentType<UserClass>;
export default User;
