import { DocumentType, getModelForClass } from "@typegoose/typegoose";
import { BlogPostClass } from "./BlogPost";

export const BlogPost = getModelForClass(BlogPostClass);

export type BlogPostDoc = DocumentType<BlogPostClass>;
