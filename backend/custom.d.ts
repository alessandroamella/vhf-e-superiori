import { FlattenMaps, LeanDocument } from "mongoose";
import type { UserDoc } from "./src/api/auth/models";

// Type definition for Passport.js Express User
declare global {
  namespace Express {
    interface User extends UserDoc {}
  }
}

// Additional Express Request interface (keeping your existing interface)
declare module "express-serve-static-core" {
  export interface Request {
    user?: Omit<
      FlattenMaps<LeanDocument<UserDoc>>,
      "password" | "joinRequests" | "__v" | "id" | "typegooseName" | "isValidPw"
    > & { createdAt: string; updatedAt: string; _id: string };
  }
}
