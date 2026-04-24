export class ChatController {
    chatService;
    constructor(chatService) {
        this.chatService = chatService;
    }
    // POST /chat/sessions
    createSession = async (req, res, next) => {
        try {
            const userId = req.user.userId;
            const session = await this.chatService.createSession(userId);
            res.status(201).json(session);
        }
        catch (err) {
            next(err);
        }
    };
    // GET /chat/sessions
    listSessions = async (req, res, next) => {
        try {
            const userId = req.user.userId;
            const sessions = await this.chatService.listSessions(userId);
            res.json(sessions);
        }
        catch (err) {
            next(err);
        }
    };
    // GET /chat/sessions/:sessionId
    getSession = async (req, res, next) => {
        try {
            const userId = req.user.userId;
            const sessionId = req.params.sessionId;
            const session = await this.chatService.getSession(sessionId, userId);
            res.json(session);
        }
        catch (err) {
            next(err);
        }
    };
    // DELETE /chat/sessions/:sessionId
    deleteSession = async (req, res, next) => {
        try {
            const userId = req.user.userId;
            const sessionId = req.params.sessionId;
            await this.chatService.deleteSession(sessionId, userId);
            res.status(204).send();
        }
        catch (err) {
            next(err);
        }
    };
    // POST /chat/sessions/:sessionId/messages
    sendMessage = async (req, res, next) => {
        try {
            const userId = req.user.userId;
            const sessionId = req.params.sessionId;
            const { content } = req.body;
            if (!content || typeof content !== "string" || !content.trim()) {
                res.status(400).json({ error: "content is required" });
                return;
            }
            const message = await this.chatService.sendMessage(sessionId, userId, content.trim());
            res.status(201).json(message);
        }
        catch (err) {
            next(err);
        }
    };
    // POST /chat/sessions/:sessionId/messages/stream
    streamMessage = async (req, res, next) => {
        try {
            const userId = req.user.userId;
            const sessionId = req.params.sessionId;
            const { content } = req.body;
            if (!content || typeof content !== "string" || !content.trim()) {
                res.status(400).json({ error: "content is required" });
                return;
            }
            // Server-Sent Events headers
            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Connection", "keep-alive");
            res.flushHeaders();
            const sendEvent = (data) => {
                res.write(`data: ${JSON.stringify(data)}\n\n`);
            };
            for await (const chunk of this.chatService.streamMessage(sessionId, userId, content.trim())) {
                sendEvent(chunk);
                if (chunk.type === "done" || chunk.type === "error")
                    break;
            }
            res.end();
        }
        catch (err) {
            next(err);
        }
    };
}
//# sourceMappingURL=chat.controller.js.map