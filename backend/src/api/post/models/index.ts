import { DocumentType, getModelForClass } from "@typegoose/typegoose";
import { BasePostClass } from "./BasePost";

export const BasePost = getModelForClass(BasePostClass);

export type BasePostDoc = DocumentType<BasePostClass>;
