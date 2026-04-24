import { Router } from "express";
import { ChatService } from "./chat.service.js";
import { ChatController } from "./chat.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
const service = new ChatService();
const controller = new ChatController(service);
const router = Router();
// Session routes
router.post("/sessions", authenticate, controller.createSession);
router.get("/sessions", authenticate, controller.listSessions);
router.get("/sessions/:sessionId", authenticate, controller.getSession);
router.delete("/sessions/:sessionId", authenticate, controller.deleteSession);
// Message routes
router.post("/sessions/:sessionId/messages", authenticate, controller.sendMessage);
router.post("/sessions/:sessionId/messages/stream", authenticate, controller.streamMessage);
export default router;
//# sourceMappingURL=chat.router.js.map