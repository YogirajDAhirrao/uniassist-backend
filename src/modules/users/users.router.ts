import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { getAllUsers, getMe } from "./users.controller.js";

const router = Router();

router.get("/me", authenticate, getMe);
router.get("/", authenticate, authorize(["admin"]), getAllUsers);

export default router;
