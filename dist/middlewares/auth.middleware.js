import jwt from "jsonwebtoken";
export const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log(req.cookies);
    console.log(authHeader, "Auth Header");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Unauthorized - No token provided",
        });
    }
    const token = authHeader.split(" ")[1];
    console.log(token);
    console.log("HEADER:", req.headers.authorization);
    console.log("TOKEN:", token);
    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        console.log(decoded);
        req.user = decoded;
        return next();
    }
    catch (err) {
        return res.status(401).json({
            message: "Unauthorized - Invalid or expired token",
        });
    }
};
export const authorize = (allowedRoles) => {
    return (req, res, next) => {
        console.log(req.user);
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        return next();
    };
};
//# sourceMappingURL=auth.middleware.js.map