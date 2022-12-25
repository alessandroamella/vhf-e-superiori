import { getModelForClass } from "@typegoose/typegoose";
import { JoinRequestClass } from "./JoinRequest";

const JoinRequest = getModelForClass(JoinRequestClass);

export { JoinRequestClass } from "./JoinRequest";
export default JoinRequest;
