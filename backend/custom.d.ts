import { UserDoc } from "./src/api/user/models";

declare module "express-serve-static-core" {
    export interface Request {
        user?: UserDoc;
    }
}
