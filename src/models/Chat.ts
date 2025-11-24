import { Document, Schema, Types } from "mongoose";

export interface IChat extends Document {
  name: string;
  isGroupChat: boolean;
  lastMessage?: Types.ObjectId | null;
  participants: Types.ObjectId[];
  admin?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const chatSchema = new Schema<IChat>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  isGroupChat: {
    type: Boolean,
    default: false,
  },
});
