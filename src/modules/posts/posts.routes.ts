import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/auth.middleware.js";

import {
  createPost,
  getFeed,
  getPostById,
  updatePost,
  deletePost,
  addComment,
  getComments,
  deleteComment,
} from "./posts.controller.js";

const router = Router();

router.get("/", authenticate, getFeed);
router.get("/:postId", authenticate, getPostById);

router.post("/", authenticate, authorize(["admin"]), createPost);
router.patch("/:postId", authenticate, authorize(["admin"]), updatePost);
router.delete("/:postId", authenticate, authorize(["admin"]), deletePost);

router.post("/:postId/comments", authenticate, addComment);
router.get("/:postId/comments", authenticate, getComments);
router.delete("/comments/:commentId", authenticate, deleteComment);

export default router;
