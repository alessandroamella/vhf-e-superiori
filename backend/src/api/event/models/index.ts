import { getModelForClass } from "@typegoose/typegoose";
import { EventClass } from "./Event";

const Event = getModelForClass(EventClass);

export { EventClass } from "./Event";
export default Event;
