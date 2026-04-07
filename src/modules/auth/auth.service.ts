import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma.js";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt.js";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}



export class AuthService {
  async register(
    name: string,
    email: string,
    password: string,
    role: "student" | "admin",
  ) {
    const existing = await prisma.user.findFirst({
      where: {
        email,
      },
    });
    if (existing) throw new Error("User Already Exists");
    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashed,
        role,
      },
    });
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);
    const hashedRefreshToken = hashToken(refreshToken);

    await prisma.refreshToken.create({
      data: {
        tokenHash: hashedRefreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      throw new Error("Invalid credentials");
    }

    // Optional: clean expired tokens for this user
    await prisma.refreshToken.deleteMany({
      where: {
        userId: user.id,
        expiresAt: { lt: new Date() },
      },
    });

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    const hashedRefreshToken = hashToken(refreshToken);

    await prisma.refreshToken.create({
      data: {
        tokenHash: hashedRefreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        // revoked defaults to false in schema
      },
    });

    return {
      accessToken,
      refreshToken, // controller will put this in cookie
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    };
  }

  async logout(refreshToken: string) {
    if (!refreshToken) return;

    const hashed = hashToken(refreshToken);
    const result = await prisma.refreshToken.updateMany({
      where: {
        tokenHash: hashed,
        revoked: false,
      },
      data: {
        revoked: true,
      },
    });
    return result;
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) throw new Error("Unauthorized");

    const hashed = hashToken(refreshToken);

    const tokenRecord = await prisma.refreshToken.findFirst({
      where: {
        tokenHash: hashed,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!tokenRecord) {
      throw new Error("Invalid refresh token");
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET!) as {
      userId: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) throw new Error("User not found");

    const newAccessToken = generateAccessToken(user.id, user.role);

    return { accessToken: newAccessToken };
  }
}
