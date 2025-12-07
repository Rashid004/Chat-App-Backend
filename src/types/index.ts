import { IUser } from "./user";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export {};
