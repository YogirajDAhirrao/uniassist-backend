import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";

import authRoutes from "./modules/auth/auth.router.js";
import userRoutes from "./modules/users/users.router.js";
import documentRoutes from "./modules/documents/documentts.router.js";
import chatRouter from "./modules/chat/chat.router.js";
import postRouter from "./modules/posts/posts.routes.js";
import emailRoutes from "./modules/email/email.routes.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, mobile apps)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true, // Allow cookies (refresh token)
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/get-users", userRoutes);
app.use("/api/document", documentRoutes);
app.use("/api/chat", chatRouter);
app.use("/api/posts", postRouter);
app.use("/api/emails", emailRoutes);

export default app;
