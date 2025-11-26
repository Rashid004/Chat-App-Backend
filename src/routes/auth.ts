import { Router } from "express";
import { login, logout, register } from "../controller/authController";
import { verifyJWT } from "../middleware/verifyJWT";

const router: Router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", verifyJWT, logout);

export default router;
