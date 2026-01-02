import { Router } from "express";
import authRoutes from "./auth";
import chatRoutes from "./chats";

const router = Router();

router.use("/auth", authRoutes);
router.use("/chat", chatRoutes);

export default router;
