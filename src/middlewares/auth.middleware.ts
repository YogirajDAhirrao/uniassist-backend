import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
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
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as {
      userId: string;
      role: string;
    };

    console.log(decoded);

    req.user = decoded;

    return next();
  } catch (err) {
    return res.status(401).json({
      message: "Unauthorized - Invalid or expired token",
    });
  }
};

export const authorize = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
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
