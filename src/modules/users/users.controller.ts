import { Request, Response } from "express";
import { UsersService } from "./users.service.js";

const usersService = new UsersService();
export const getMe = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const user = await usersService.getUserById(userId);
    return res.json(user);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};
export const getAllUsers = async (req: Request, res: Response) => {
  const users = await usersService.getAllUsers();
  return res.json(users);
};
