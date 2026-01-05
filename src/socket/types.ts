import { IUser } from "../types/user";

declare module "socket.io" {
  interface Socket {
    user: IUser;
  }
}
