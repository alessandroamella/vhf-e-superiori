import { FlattenMaps, LeanDocument } from "mongoose";
import { UserDoc } from "./src/api/user/models";

declare module "express-serve-static-core" {
    export interface Request {
        user?:
            | Omit<
                  FlattenMaps<LeanDocument<UserDoc>>,
                  | "password"
                  | "joinRequests"
                  | "__v"
                  | "id"
                  | "typegooseName"
                  | "isValidPw"
              > & { createdAt: string; updatedAt: string; _id: string };
    }
}
