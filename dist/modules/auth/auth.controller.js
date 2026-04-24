import { AuthService } from "./auth.service.js";
const ALLOWED_ROLES = ["student", "admin"];
const isProd = process.env.NODE_ENV === "production";
const authService = new AuthService();
export const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (role && !ALLOWED_ROLES.includes(role)) {
            throw new Error(`Invalid userType. Must be one of: ${ALLOWED_ROLES.join(", ")}`);
        }
        const result = await authService.register(name, email, password, role);
        res.cookie("refreshToken", result.refreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "strict" : "lax",
        });
        return res.status(201).json({
            message: "success",
            accessToken: result.accessToken,
            user: result.user,
        });
    }
    catch (error) {
        return res.status(400).json({ message: error.message });
    }
};
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        res.cookie("refreshToken", result.refreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "strict" : "lax",
        });
        return res.status(201).json({
            message: "success",
            accessToken: result.accessToken,
            user: result.user,
        });
    }
    catch (error) {
        return res.status(400).json({ message: error.message });
    }
};
export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken)
            throw new Error("No Refresh token provided");
        const result = await authService.logout(refreshToken);
        res.clearCookie("refreshToken");
        res.json({
            message: "success",
        });
    }
    catch (error) {
        return res.status(400).json({ message: error.message });
    }
};
export const refresh = async (req, res) => {
    try {
        console.log("cookies:", req.cookies);
        console.log("refreshToken:", req.cookies?.refreshToken);
        const refreshToken = req.cookies.refreshToken;
        console.log(refreshToken);
        const result = await authService.refresh(refreshToken);
        return res.status(201).json({
            message: "success",
            accessToken: result.accessToken,
        });
    }
    catch (error) {
        return res.status(400).json({ message: error.message });
    }
};
//# sourceMappingURL=auth.controller.js.map