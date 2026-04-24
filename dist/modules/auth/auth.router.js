import { Router } from "express";
import { login, logout, refresh, register } from "./auth.controller.js";
const router = Router();
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
// Require access token for logout
router.post("/logout", logout);
export default router;
//# sourceMappingURL=auth.router.js.map