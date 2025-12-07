import { Document, Types } from "mongoose";

/* --------- Chat Document Interface (TypeScript) --------------- */
export interface IChat extends Document {
  name: string;
  isGroupChat: boolean;
  lastMessage?: Types.ObjectId | null;
  participants: Types.ObjectId[];
  admin?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
