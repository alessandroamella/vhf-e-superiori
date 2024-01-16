import { DocumentType, getModelForClass } from "@typegoose/typegoose";
import { CommentClass } from "./Comment";

export const Comment = getModelForClass(CommentClass);

export type CommentDoc = DocumentType<CommentClass>;
