import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";

import authRoutes from "./modules/auth/auth.router.js";
import userRoutes from "./modules/users/users.router.js";
import documentRoutes from "./modules/documents/documentts.router.js";
import chatRouter from "./modules/chat/chat.router.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/get-users", userRoutes);
app.use("/api/document", documentRoutes);
app.use("/api/chat", chatRouter);

export default app;
