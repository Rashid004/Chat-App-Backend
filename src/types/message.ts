import { Document, Types } from "mongoose";

export interface IChatMessage extends Document {
  sender: Types.ObjectId;
  content?: string;
  attachments: {
    url: string;
    localPath: string;
  }[];
  chat: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
