import { prisma } from "../../lib/prisma.js";

interface CreatePostInput {
  title?: string;
  content: string;
  courseId: number;
  authorId: string;
  imageUrl?: string;
  documentUrl?: string;
}

interface UpdatePostInput {
  title?: string;
  content?: string;
  courseId?: number;
  imageUrl?: string | null;
  documentUrl?: string | null;
  isPinned?: boolean;
}

export class PostsService {
  async createPost(data: CreatePostInput) {
    const post = await prisma.post.create({
      data,
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        course: true,
      },
    });

    return post;
  }

  async getFeed(userId: string) {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        courseId: true,
      },
    });

    if (!user) {
      throw new Error("User Not Found");
    }

    const posts = await prisma.post.findMany({
      where: {
        courseId: {
          in: [1, user.courseId!], // 1 = ALL
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        course: true,
      },
      orderBy: [
        {
          isPinned: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    return posts;
  }

  async getPostById(postId: string) {
    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        course: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!post) {
      throw new Error("Post Not Found");
    }

    return post;
  }

  async updatePost(postId: string, data: UpdatePostInput) {
    const existingPost = await prisma.post.findUnique({
      where: {
        id: postId,
      },
    });

    if (!existingPost) {
      throw new Error("Post Not Found");
    }

    const post = await prisma.post.update({
      where: {
        id: postId,
      },
      data,
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        course: true,
      },
    });

    return post;
  }

  async deletePost(postId: string) {
    const existingPost = await prisma.post.findUnique({
      where: {
        id: postId,
      },
    });

    if (!existingPost) {
      throw new Error("Post Not Found");
    }

    await prisma.post.delete({
      where: {
        id: postId,
      },
    });

    return {
      message: "Post deleted successfully",
    };
  }
  async addComment(postId: string, userId: string, content: string) {
    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
    });

    if (!post) {
      throw new Error("Post Not Found");
    }

    const comment = await prisma.postComment.create({
      data: {
        postId,
        userId,
        content,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return comment;
  }
  async getComments(postId: string) {
    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
    });

    if (!post) {
      throw new Error("Post Not Found");
    }

    const comments = await prisma.postComment.findMany({
      where: {
        postId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return comments;
  }
  async deleteComment(commentId: string) {
    const comment = await prisma.postComment.findUnique({
      where: {
        id: commentId,
      },
    });

    if (!comment) {
      throw new Error("Comment Not Found");
    }

    await prisma.postComment.delete({
      where: {
        id: commentId,
      },
    });

    return {
      message: "Comment deleted successfully",
    };
  }
}
