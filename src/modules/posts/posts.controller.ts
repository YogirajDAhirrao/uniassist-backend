import { Request, Response } from "express";
import { PostsService } from "./posts.service.js";

const postsService = new PostsService();

export const createPost = async (req: any, res: Response) => {
  try {
    const { title, content, courseId, imageUrl, documentUrl } = req.body;

    const authorId = req.user.userId;

    const post = await postsService.createPost({
      title,
      content,
      courseId,
      authorId,
      imageUrl,
      documentUrl,
    });

    return res.status(201).json(post);
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const getFeed = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;

    const posts = await postsService.getFeed(userId);

    return res.json(posts);
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const getPostById = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    const post = await postsService.getPostById(postId as any);

    return res.json(post);
  } catch (error: any) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

export const updatePost = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    const post = await postsService.updatePost(
      postId as any,
      req.body
    );

    return res.json(post);
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const deletePost = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    const result = await postsService.deletePost(postId as any);

    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const addComment = async (req: any, res: Response) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    const userId = req.user.userId;

    const comment = await postsService.addComment(
      postId,
      userId,
      content
    );

    return res.status(201).json(comment);
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const getComments = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    const comments = await postsService.getComments(postId as any);

    return res.json(comments);
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;

    const result = await postsService.deleteComment(commentId as any);

    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};