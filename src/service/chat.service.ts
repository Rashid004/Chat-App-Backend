import { Types } from "mongoose";
import { chatRepository } from "../repository/chat.repository";

/**
 * Business logic layer for chat operations
 * Handles validation, authorization, and orchestrates repository calls
 */
export class ChatService {
  private chatRepo: chatRepository;

  constructor() {
    this.chatRepo = new chatRepository();
  }

  /**
   * Create a new one-on-one chat or retrieve existing one
   * Prevents users from creating chats with themselves
   * @param userId - The current user's ID
   * @param receiverId - The recipient user's ID
   * @returns Promise resolving to the chat document (existing or newly created)
   * @throws Error if user attempts to chat with themselves
   */
  async createOrGetOneOnOneChat(userId: string, receiverId: string) {
    if (userId === receiverId) {
      throw new Error("You cannot chat with yourself.");
    }

    const existingChat = await this.chatRepo.findOneOnOneChat(
      new Types.ObjectId(userId),
      new Types.ObjectId(receiverId)
    );

    if (existingChat) return existingChat;

    // Create new chat
    return this.chatRepo.createOneOnOneChat({
      name: "Private Chat",
      participants: [userId, receiverId],
      isGroupChat: false,
      admin: userId,
    });
  }

  /**
   * Create a new group chat with multiple participants
   * Ensures the group has at least 3 members (including creator)
   * @param name - The name of the group chat
   * @param creatorId - The ID of the user creating the group
   * @param participantIds - Array of participant user IDs
   * @returns Promise resolving to the newly created group chat
   * @throws Error if group has fewer than 3 participants
   */
  async createGroupChat(
    name: string,
    creatorId: string,
    participantIds: string[]
  ) {
    const members = [...new Set([creatorId, ...participantIds])];

    if (members.length < 3) {
      throw new Error("Group must have at least 3 participants.");
    }

    return this.chatRepo.createGroupChat({
      name,
      participants: members,
      isGroupChat: true,
      admin: creatorId,
    });
  }

  /**
   * Retrieve all chats for a specific user
   * Returns both one-on-one and group chats sorted by most recent activity
   * @param userId - The user's ID
   * @returns Promise resolving to array of chat documents
   */
  async getUserChat(userId: string) {
    return this.chatRepo.findUserChats(new Types.ObjectId(userId));
  }

  /**
   * Get detailed information about a specific chat
   * @param chatId - The chat's ID
   * @returns Promise resolving to the chat document
   */
  async getChatDetails(chatId: string) {
    return this.chatRepo.findChatById(new Types.ObjectId(chatId));
  }

  /**
   * Add a new participant to a group chat
   * Only the group admin can add participants
   * @param chatId - The chat's ID
   * @param adminId - The ID of the user attempting to add a participant
   * @param participantId - The ID of the user being added
   * @returns Promise resolving to the updated chat document
   * @throws Error if chat doesn't exist, is not a group chat, or user is not admin
   */
  async addParticipant(chatId: string, adminId: string, participantId: string) {
    const chat = await this.chatRepo.findChatById(new Types.ObjectId(chatId));

    if (!chat) throw new Error("Chat does not exist");
    if (!chat.isGroupChat) throw new Error("Not a group chat");

    if (chat.admin?.toString() !== adminId.toString()) {
      throw new Error("Only admin can add participants");
    }

    return this.chatRepo.addParticipant(
      new Types.ObjectId(chatId),
      new Types.ObjectId(participantId)
    );
  }

  /**
   * Remove a participant from a group chat
   * Only the group admin can remove participants
   * @param chatId - The chat's ID
   * @param adminId - The ID of the user attempting to remove a participant
   * @param participantId - The ID of the user being removed
   * @returns Promise resolving to the updated chat document
   * @throws Error if chat doesn't exist or user is not admin
   */
  async removeParticipant(
    chatId: string,
    adminId: string,
    participantId: string
  ) {
    const chat = await this.chatRepo.findChatById(new Types.ObjectId(chatId));

    if (!chat) throw new Error("Chat does not exist");

    if (chat.admin?.toString() !== adminId.toString()) {
      throw new Error("Only admin can remove participants");
    }

    return this.chatRepo.removeParticipant(
      new Types.ObjectId(chatId),
      new Types.ObjectId(participantId)
    );
  }

  /**
   * Allow a user to leave a group chat
   * Cannot be used to leave one-on-one chats
   * @param chatId - The chat's ID
   * @param userId - The ID of the user leaving the group
   * @returns Promise resolving to the updated chat document
   * @throws Error if chat doesn't exist or is not a group chat
   */
  async leaveGroup(chatId: string, userId: string) {
    const chat = await this.chatRepo.findChatById(new Types.ObjectId(chatId));

    if (!chat) throw new Error("Chat does not exist");
    if (!chat.isGroupChat) throw new Error("Cannot leave a private chat");

    return this.chatRepo.removeParticipant(
      new Types.ObjectId(chatId),
      new Types.ObjectId(userId)
    );
  }

  /**
   * Rename a group chat
   * Only the group admin can rename the chat
   * @param chatId - The chat's ID
   * @param adminId - The ID of the user attempting to rename
   * @param newName - The new name for the group
   * @returns Promise resolving to the updated chat document
   * @throws Error if chat doesn't exist or user is not admin
   */
  async renameGroup(chatId: string, adminId: string, newName: string) {
    const chat = await this.chatRepo.findChatById(new Types.ObjectId(chatId));
    if (!chat) throw new Error("Chat does not exist");
    if (chat.admin?.toString() !== adminId) {
      throw new Error("Only admin can rename group");
    }
    return this.chatRepo.renameGroup(new Types.ObjectId(chatId), newName);
  }
}
