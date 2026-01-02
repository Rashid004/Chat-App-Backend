import { Socket } from "socket.io";
import { ApiError } from "../utils/api-error";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { UserModel } from "../models/user";

export const setupSocketAuth = (
  socket: Socket,
  next: (err?: Error) => void
) => {
  try {
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new ApiError(401, "Socket token missing"));
    }

    const decoded = jwt.verify(token, env.JWT_ACCESS_TOKEN_SECRET) as {
      _id: string;
    };

    const user = UserModel.findById(decoded._id).select(
      "-password -refreshTokens"
    );

    if (!user) {
      return next(new ApiError(401, "Socket user not found"));
    }

    socket.user = user;
  } catch (error) {
    next(new ApiError(401, "Socket authentication failed"));
  }
};
