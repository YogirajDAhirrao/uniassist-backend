import { UsersService } from "./users.service.js";
const usersService = new UsersService();
export const getMe = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await usersService.getUserById(userId);
        return res.json(user);
    }
    catch (error) {
        return res.status(400).json({ message: error.message });
    }
};
export const getAllUsers = async (req, res) => {
    const users = await usersService.getAllUsers();
    return res.json(users);
};
//# sourceMappingURL=users.controller.js.map