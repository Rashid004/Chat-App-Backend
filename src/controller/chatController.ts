import {
  addParticipantDto,
  createGroupChatDto,
  createOneOnOneChatDto,
  removeParticipantDto,
  renameGroupChatDto,
} from "../dto/chat.dto";
import { ChatService } from "../service/chat.service";
import { ApiResponse } from "../utils/api-response";
import { asyncHandler } from "../utils/asyncHandler";

const chatService = new ChatService();

/**
 * Create a new one-on-one chat or retrieve existing chat between two users
 *
 * @route POST /api/chats/one-on-one/:receiverId
 * @access Private - Requires authentication
 *
 * @param req.params.receiverId - The ID of the user to chat with
 * @param req.user._id - The authenticated user's ID (injected by auth middleware)
 *
 * @returns {Object} 200 - Chat object (existing or newly created)
 * @throws {Error} 400 - If receiverId is invalid or user tries to chat with themselves
 */
export const createOrGetOneOnOneChat = asyncHandler(async (req, res) => {
  const { receiverId } = createOneOnOneChatDto.parse(req.params);

  const chat = await chatService.createOrGetOneOnOneChat(
    req.user!._id.toString(),
    receiverId
  );

  return res
    .status(200)
    .json(new ApiResponse(200, chat, "One-on-one chat created."));
});

/**
 * Create a new group chat with multiple participants
 *
 * @route POST /api/chats/group
 * @access Private - Requires authentication
 *
 * @param req.body.name - The name of the group chat
 * @param req.body.participants - Array of user IDs to include in the group (minimum 2)
 * @param req.user._id - The authenticated user's ID who becomes the admin
 *
 * @returns {Object} 201 - Newly created group chat object
 * @throws {Error} 400 - If name is invalid or participants array has fewer than 2 members
 */
export const createGroupChat = asyncHandler(async (req, res) => {
  const { name, participants } = createGroupChatDto.parse(req.body);

  const chat = await chatService.createGroupChat(
    name,
    req.user!._id.toString(),
    participants
  );
  return res
    .status(201)
    .json(new ApiResponse(201, chat, "Group chat created successfully."));
});

/**
 * Get all chats for the authenticated user
 * Retrieves both one-on-one and group chats sorted by most recent activity
 *
 * @route GET /api/chats
 * @access Private - Requires authentication
 *
 * @param req.user._id - The authenticated user's ID
 *
 * @returns {Object} 200 - Array of chat objects sorted by updatedAt (descending)
 */
export const getAllChats = asyncHandler(async (req, res) => {
  const chats = await chatService.getUserChat(req.user!._id.toString());
  return res
    .status(200)
    .json(new ApiResponse(200, chats, "Chats fetched successfully."));
});

/**
 * Get detailed information about a specific chat
 *
 * @route GET /api/chats/:chatId
 * @access Private - Requires authentication and chat membership
 *
 * @param req.params.chatId - The ID of the chat to retrieve
 *
 * @returns {Object} 200 - Chat object with full details
 * @throws {Error} 404 - If chat is not found
 */
export const getChatDetails = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  if (!chatId) {
    throw new Error("Chat ID is required");
  }

  const chat = await chatService.getChatDetails(chatId);
  return res
    .status(200)
    .json(new ApiResponse(200, chat, "Chat details fetched."));
});

/**
 * Add a new participant to a group chat
 * Only the group admin can add participants
 *
 * @route POST /api/chats/:chatId/participants/:participantId
 * @access Private - Requires authentication and admin privileges
 *
 * @param req.params.chatId - The ID of the group chat
 * @param req.params.participantId - The ID of the user to add
 * @param req.user._id - The authenticated user's ID (must be admin)
 *
 * @returns {Object} 200 - Updated chat object with new participant
 * @throws {Error} 403 - If user is not the group admin
 * @throws {Error} 400 - If chat is not a group chat
 * @throws {Error} 404 - If chat is not found
 */
export const addParticipant = asyncHandler(async (req, res) => {
  const { chatId, participantId } = addParticipantDto.parse(req.params);

  const chat = await chatService.addParticipant(
    chatId,
    req.user!._id.toString(),
    participantId
  );

  return res
    .status(200)
    .json(new ApiResponse(200, chat, "Participant added successfully."));
});

/**
 * Remove a participant from a group chat
 * Only the group admin can remove participants
 *
 * @route DELETE /api/chats/:chatId/participants/:participantId
 * @access Private - Requires authentication and admin privileges
 *
 * @param req.params.chatId - The ID of the group chat
 * @param req.params.participantId - The ID of the user to remove
 * @param req.user._id - The authenticated user's ID (must be admin)
 *
 * @returns {Object} 200 - Updated chat object without the removed participant
 * @throws {Error} 403 - If user is not the group admin
 * @throws {Error} 404 - If chat is not found
 */
export const removeParticipant = asyncHandler(async (req, res) => {
  const { chatId, participantId } = removeParticipantDto.parse(req.params);

  const chat = await chatService.removeParticipant(
    chatId,
    req.user!._id.toString(),
    participantId
  );

  return res
    .status(200)
    .json(new ApiResponse(200, chat, "Participant removed successfully."));
});

/**
 * Leave a group chat as a participant
 * Allows any participant to remove themselves from the group
 * Cannot be used for one-on-one chats
 *
 * @route POST /api/chats/:chatId/leave
 * @access Private - Requires authentication and chat membership
 *
 * @param req.params.chatId - The ID of the group chat to leave
 * @param req.user._id - The authenticated user's ID
 *
 * @returns {Object} 200 - Updated chat object without the user
 * @throws {Error} 400 - If chat is not a group chat
 * @throws {Error} 404 - If chat is not found
 */
export const leaveGroup = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  if (!chatId) {
    throw new Error("Chat ID is required");
  }

  const chat = await chatService.leaveGroup(chatId, req.user!._id.toString());

  return res
    .status(200)
    .json(new ApiResponse(200, chat, "Left the group successfully."));
});

/**
 * Rename a group chat
 * Only the group admin can rename the chat
 *
 * @route PATCH /api/chats/:chatId/rename
 * @access Private - Requires authentication and admin privileges
 *
 * @param req.params.chatId - The ID of the group chat to rename
 * @param req.body.name - The new name for the group (minimum 2 characters)
 * @param req.user._id - The authenticated user's ID (must be admin)
 *
 * @returns {Object} 200 - Updated chat object with new name
 * @throws {Error} 403 - If user is not the group admin
 * @throws {Error} 400 - If name is invalid
 * @throws {Error} 404 - If chat is not found
 */
export const renameGroupChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { name } = renameGroupChatDto.parse(req.body);

  if (!chatId) {
    throw new Error("Chat ID is required");
  }

  const chat = await chatService.renameGroup(
    chatId,
    req.user!._id.toString(),
    name
  );

  return res
    .status(200)
    .json(new ApiResponse(200, chat, "Group chat renamed."));
});
