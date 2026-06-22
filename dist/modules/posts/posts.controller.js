import { PostsService } from "./posts.service.js";
const postsService = new PostsService();
export const createPost = async (req, res) => {
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
    }
    catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
};
export const getFeed = async (req, res) => {
    try {
        const userId = req.user.userId;
        const posts = await postsService.getFeed(userId);
        return res.json(posts);
    }
    catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
};
export const getPostById = async (req, res) => {
    try {
        const { postId } = req.params;
        const post = await postsService.getPostById(postId);
        return res.json(post);
    }
    catch (error) {
        return res.status(404).json({
            message: error.message,
        });
    }
};
export const updatePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const post = await postsService.updatePost(postId, req.body);
        return res.json(post);
    }
    catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
};
export const deletePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const result = await postsService.deletePost(postId);
        return res.json(result);
    }
    catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
};
export const addComment = async (req, res) => {
    try {
        const { postId } = req.params;
        const { content } = req.body;
        const userId = req.user.userId;
        const comment = await postsService.addComment(postId, userId, content);
        return res.status(201).json(comment);
    }
    catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
};
export const getComments = async (req, res) => {
    try {
        const { postId } = req.params;
        const comments = await postsService.getComments(postId);
        return res.json(comments);
    }
    catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
};
export const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const result = await postsService.deleteComment(commentId);
        return res.json(result);
    }
    catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
};
//# sourceMappingURL=posts.controller.js.map