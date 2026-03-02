import { Router } from "express";
import { login, logout, refresh, register } from "./auth.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);

// Require access token for logout
router.post("/logout", authenticate, logout);

export default router;
