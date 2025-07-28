import { FlattenMaps, LeanDocument, Types } from "mongoose";
import type { UserDoc } from "../api/auth/models";

// Override Express Request interface
declare module "express-serve-static-core" {
  export interface Request {
    user?: Omit<
      FlattenMaps<LeanDocument<UserDoc>>,
      "password" | "joinRequests" | "__v" | "id" | "typegooseName" | "isValidPw"
    > & { createdAt: string; updatedAt: string; _id: string };
  }
}

// Override Passport's Express User interface
declare global {
  namespace Express {
    interface User extends UserDoc {}
  }
}
