import { z } from "zod";

//🧩 Create One-On-One Chat DTO
export const createOneOnOneChatDto = z.object({
  receiverId: z.string().min(1, "Receiver ID is required"),
});

// 🧩 Create Group Chat DTO
export const createGroupChatDto = z.object({
  name: z.string().min(2, "Group name must be at least 2 characters"),
  participants: z
    .array(z.string())
    .min(2, "Group must have at least 2 participants (excluding admin)"),
});

export const renameGroupChatDto = z.object({
  name: z.string().min(2, "Group name must be at least 2 characters"),
});

export const addParticipantDto = z.object({
  chatId: z.string().min(1, "Chat ID is required"),
  participantId: z.string().min(1, "Participant ID is required"),
});

export const removeParticipantDto = z.object({
  chatId: z.string().min(1, "Chat ID is required"),
  participantId: z.string().min(1, "Participant ID is required"),
});

// 🧩 Send Message DTO

export const sendMessageDto = z.object({
  content: z.string().optional().default(""),
});

export type CreateOneOnOneChatDto = z.infer<typeof createOneOnOneChatDto>;
export type CreateGroupChatDto = z.infer<typeof createGroupChatDto>;
export type RenameGroupChatDto = z.infer<typeof renameGroupChatDto>;
export type AddParticipantDto = z.infer<typeof addParticipantDto>;
export type RemoveParticipantDto = z.infer<typeof removeParticipantDto>;
export type SendMessageDto = z.infer<typeof sendMessageDto>;
