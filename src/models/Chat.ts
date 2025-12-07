import { model, Schema } from "mongoose";
import { IChat } from "../types/chat";

/* ------------- Chat Schema -------------- */

const chatSchema = new Schema<IChat>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "ChatMessage",
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        require: true,
      },
    ],
    admin: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

chatSchema.index({ participants: 1 });

chatSchema.index({ updatedAt: -1 });

chatSchema.index({ isGroupChat: 1 });

export const ChatModel = model<IChat>("Chat", chatSchema);
