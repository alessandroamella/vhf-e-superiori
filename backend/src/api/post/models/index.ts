import { DocumentType, getModelForClass } from "@typegoose/typegoose";
import { PostClass } from "./Post";

const Post = getModelForClass(PostClass);

export { PostClass } from "./Post";
export type PostDoc = DocumentType<PostClass>;
export default Post;
