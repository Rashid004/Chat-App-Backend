import { Server, Socket } from "socket.io";
import { CHAT_EVENTS } from "../utils/utilsConstant";

export const registerChatEvents = (io: Server, socket: Socket) => {
  /* -------------------- Join Chat Room -------------------- */
  socket.on("join-chat", (chatId: string) => {
    socket.join(chatId);
    console.log(`👥 User joined chat ${chatId}`);
  });

  /* -------------------- Typing Indicator -------------------- */
  socket.on(CHAT_EVENTS.TYPING, (chatId: string) => {
    socket
      .to(chatId)
      .emit(CHAT_EVENTS.TYPING, { chatId, userId: socket.user._id });
  });

  /* -------------------- Stop Typing Indicator -------------------- */
  socket.on(CHAT_EVENTS.STOP_TYPING, (chatId: string) => {
    socket
      .to(chatId)
      .emit(CHAT_EVENTS.STOP_TYPING, { chatId, userId: socket.user._id });
  });

  /* -------------------- Send Message -------------------- */
  socket.on(CHAT_EVENTS.SEND_MESSAGE, ({ chatId, message }) => {
    socket.to(chatId).emit(CHAT_EVENTS.MESSAGE_RECEIVED, message);
  });
};
