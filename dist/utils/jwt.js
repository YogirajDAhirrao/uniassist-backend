import jwt from "jsonwebtoken";
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
export const generateAccessToken = (userId, role) => {
    return jwt.sign({ userId, role }, ACCESS_SECRET, { expiresIn: "15m" });
};
export const generateRefreshToken = (userId) => {
    return jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: "7d" });
};
export const verifyRefreshToken = (token) => {
    return jwt.verify(token, REFRESH_SECRET);
};
//# sourceMappingURL=jwt.js.map