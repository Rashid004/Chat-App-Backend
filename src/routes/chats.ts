import { Router } from "express";
import {
  addParticipant,
  createGroupChat,
  createOrGetOneOnOneChat,
  getChatDetails,
  leaveGroup,
  renameGroupChat,
} from "../controller/chatController";
import { verifyJWT } from "../middleware/verifyJWT";

const router: Router = Router();

/*------------- One-on-One Chat ----------------*/

router.post("/one/:receiverId", verifyJWT, createOrGetOneOnOneChat);

/*------------- Group Chat ----------------*/
router.post("/group", verifyJWT, createGroupChat);

/*------------- Group Chat Management ----------------*/
router.patch("/group/:chatId/rename", verifyJWT, renameGroupChat);

/* Add participant to group chat */
router.post("/group/:chatId/add/:participantId", verifyJWT, addParticipant);

/* Leave group chat */
router.post("/group/:chatId/leave", verifyJWT, leaveGroup);

/* Get chat details */
router.get("/:chatId", verifyJWT, getChatDetails);

export default router;
