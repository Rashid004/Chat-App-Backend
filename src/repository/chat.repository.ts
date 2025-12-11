import { Types } from "mongoose";
import { ChatModel } from "../models/chat";
import { ChatMessageModel } from "../models/message";

/**
 * Data access layer for chat operations
 * Handles all database interactions for chats and messages
 */
export class chatRepository {
  /**
   * Find an existing one-on-one chat between two users
   * @param userId - First user's ObjectId
   * @param receiverId - Second user's ObjectId
   * @returns Promise resolving to the chat document or null
   */
  findOneOnOneChat(userId: Types.ObjectId, receiverId: Types.ObjectId) {
    return ChatModel.findOne({
      isGroupChat: false,
      participants: { $all: [userId, receiverId] },
    });
  }

  /**
   * Create a new one-on-one chat between two users
   * @param chatData - Object containing chat creation data
   * @returns Promise resolving to the newly created chat
   */
  createOneOnOneChat(chatData: {
    name: string;
    participants: string[];
    isGroupChat: boolean;
    admin: string;
  }) {
    return ChatModel.create({
      name: chatData.name,
      participants: chatData.participants.map(id => new Types.ObjectId(id)),
      admin: new Types.ObjectId(chatData.admin),
      isGroupChat: chatData.isGroupChat,
    });
  }

  /**
   * Create a new group chat
   * @param chatData - Object containing group chat creation data
   * @returns Promise resolving to the newly created group chat
   */
  createGroupChat(chatData: {
    name: string;
    participants: string[];
    isGroupChat: boolean;
    admin: string;
  }) {
    return ChatModel.create({
      name: chatData.name,
      isGroupChat: chatData.isGroupChat,
      participants: chatData.participants.map(id => new Types.ObjectId(id)),
      admin: new Types.ObjectId(chatData.admin),
    });
  }

  /**
   * Find a group chat by its ID
   * @param chatId - The chat's ObjectId
   * @returns Promise resolving to the group chat or null
   */
  getGroupChat(chatId: Types.ObjectId) {
    return ChatModel.findOne({
      _id: chatId,
      isGroupChat: true,
    });
  }

  /**
   * Rename a group chat
   * @param chatId - The chat's ObjectId
   * @param newName - The new name for the group
   * @returns Promise resolving to the updated chat document
   */
  renameGroup(chatId: Types.ObjectId, newName: string) {
    return ChatModel.findByIdAndUpdate(
      chatId,
      { name: newName },
      { new: true }
    );
  }

  /**
   * Add a participant to a chat
   * @param chatId - The chat's ObjectId
   * @param participantId - The user's ObjectId to add
   * @returns Promise resolving to the updated chat document
   */
  addParticipant(chatId: Types.ObjectId, participantId: Types.ObjectId) {
    return ChatModel.findByIdAndUpdate(
      chatId,
      { $addToSet: { participants: participantId } },
      { new: true }
    );
  }

  /**
   * Remove a participant from a chat
   * @param chatId - The chat's ObjectId
   * @param participantId - The user's ObjectId to remove
   * @returns Promise resolving to the updated chat document
   */
  removeParticipant(chatId: Types.ObjectId, participantId: Types.ObjectId) {
    return ChatModel.findByIdAndUpdate(
      chatId,
      { $pull: { participants: participantId } },
      { new: true }
    );
  }

  /**
   * Delete a chat permanently
   * @param chatId - The chat's ObjectId
   * @returns Promise resolving to the deleted chat document
   */
  deleteChat(chatId: Types.ObjectId) {
    return ChatModel.findByIdAndDelete(chatId);
  }

  /**
   * Find all chats where a user is a participant
   * @param userId - The user's ObjectId
   * @returns Promise resolving to array of chat documents sorted by most recent
   */
  findUserChats(userId: Types.ObjectId) {
    return ChatModel.find({
      participants: userId,
    }).sort({ updatedAt: -1 });
  }

  /**
   * Find a chat by its ID with full details
   * @param chatId - The chat's ObjectId
   * @returns Promise resolving to the chat document or null
   */
  findChatById(chatId: Types.ObjectId) {
    return ChatModel.findById(chatId);
  }

  /**
   * Get all messages for a specific chat
   * @param chatId - The chat's ObjectId
   * @returns Promise resolving to array of message documents sorted by most recent
   */
  findMessagesByChatId(chatId: Types.ObjectId) {
    return ChatMessageModel.find({ chat: chatId }).sort({
      createdAt: -1,
    });
  }

  /**
   * Create a new message in a chat
   * @param chatId - The chat's ObjectId
   * @param senderId - The sender's ObjectId
   * @param content - The message content
   * @param attachments - Array of attachment objects
   * @returns Promise resolving to the newly created message
   */
  createMessage(
    chatId: Types.ObjectId,
    senderId: Types.ObjectId,
    content: string,
    attachments: { url: string; localPath: string }[]
  ) {
    return ChatMessageModel.create({
      chat: chatId,
      sender: senderId,
      content,
      attachments,
    });
  }

  /**
   * Delete a message permanently
   * @param messageId - The message's ObjectId
   * @returns Promise resolving to the deleted message document
   */
  deleteMessage(messageId: Types.ObjectId) {
    return ChatMessageModel.findByIdAndDelete(messageId);
  }
}
