import { Types } from "mongoose";
import { ChatModel } from "../models/chat";
import { ChatMessageModel } from "../models/message";

export const chatRepository = {
  /*------- Find One On One Chat ------*/
  findOneOnOneChat(userId: string, receiverId: string) {
    return ChatModel.findOne({
      isGroupChat: false,
      participants: { $all: [userId, receiverId] },
    });
  },

  /*------- Create One On One Chat ------*/
  createOneOnOneChat(userId: string, receiverId: string) {
    return ChatModel.create({
      name: "One-on-one chat",
      participants: [userId, receiverId],
      admin: userId,
      isGroupChat: false,
    });
  },

  /*-------- Create a group chat -------- */
  createGroupChat(name: string, members: string[], adminId: string) {
    return ChatModel.create({
      name,
      isGroupChat: true,
      participants: members,
      admin: adminId,
    });
  },

  /*-------- Get group chat details -------- */
  getGroupChat(chatId: string) {
    return ChatModel.findOne({
      _id: new Types.ObjectId(chatId),
      isGroupChat: true,
    });
  },

  /*-------- Rename group chat -------- */
  renameGroup(chatId: string, newName: string) {
    return ChatModel.findByIdAndUpdate(
      chatId,
      { name: newName },
      { new: true }
    );
  },

  /*-------- Add participant to group -------- */
  addParticipant(chatId: string, participantId: string) {
    return ChatModel.findByIdAndUpdate(
      chatId,
      {
        $addToSet: { participants: participantId },
      },
      { new: true }
    );
  },

  /*-------- Remove participant -------- */
  removeParticipant(chatId: string, participantId: string) {
    return ChatModel.findByIdAndUpdate(
      chatId,
      {
        $pull: { participants: participantId },
      },
      { new: true }
    );
  },
  /*-------- Delete a chat -------- */
  deleteChat(chatId: string) {
    return ChatModel.findByIdAndDelete(chatId);
  },

  /*-------- Get  all chat -------- */
  getAllChatsForUser(userId: string) {
    return ChatModel.find({
      participants: userId,
    }).sort({ updatedAt: -1 });
  },

  /*-------- Get all message chat -------- */
  getMessages(userId: string) {
    return ChatMessageModel.find({
      chat: chatId,
    }).sort({ updatedAt: -1 });
  },

  createMessage(
    chatId: string,
    senderId: string,
    content: string,
    attachments: { url: string; localPath: string }[]
  ) {
    return ChatMessageModel.create({
      chat: chatId,
      sender: senderId,
      content,
      attachments,
    });
  },

  deleteMessage(messageId: string) {
    return ChatMessageModel.findByIdAndDelete(messageId);
  },
};
