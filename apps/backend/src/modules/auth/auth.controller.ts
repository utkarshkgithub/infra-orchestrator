import { Request, Response } from "express";
import { env } from "../../lib/env.js";
import { prisma } from "../../lib/prisma.js";
import jwt from "jsonwebtoken";
import { sessionCookieOptions } from "../../utils/cookie.utils.js";
import { logger } from "../../lib/logger.js";

export const devLogin = async (_req: Request, res: Response) => {
  if (env.NODE_ENV !== "development") {
    return res.sendStatus(404);
  }

  const user = await prisma.user.findUnique({
    where: { login: "dev" },
  });

  if (!user) {
    return res.status(404).json({ error: "Dev user not found" });
  }

  const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
    expiresIn: "30d",
  });
  res.cookie("token", token, sessionCookieOptions);
  logger.info({token});
  return res.json({ success: true });
};
