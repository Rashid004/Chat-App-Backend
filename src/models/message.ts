import { model, Schema, Types } from "mongoose";
import { IChatMessage } from "../types/message";

const chatMessageSchema = new Schema<IChatMessage>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      default: "",
    },

    attachments: [
      {
        url: { type: String },
        localPath: { type: String },
      },
    ],
    chat: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
  },
  { timestamps: true }
);

chatMessageSchema.index({ chat: 1 });
chatMessageSchema.index({ sender: 1 });
chatMessageSchema.index({ createdAt: -1 });

export const ChatMessageModel = model<IChatMessage>(
  "ChatMessage",
  chatMessageSchema
);
