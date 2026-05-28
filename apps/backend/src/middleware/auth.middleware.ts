import jwt, { JwtPayload } from "jsonwebtoken";
import { Response, Request, NextFunction } from "express";
import { AppError } from "./error.middleware.js";
import { env } from "../lib/env.js";
import { logger } from "../lib/logger.js";
export const authMiddlewareJWT = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies.token;
  if (!token) {
    throw new AppError(401, "No token provided");
  }
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtUserPayload;
    //TODO fetch the user details and cache it in frontend
    //Declare global namespace
    req.user = {
      id: decoded.userId,
    };
    next();
    
  } catch (err) {
    logger.error(err,"Token Error")
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
};

interface JwtUserPayload extends JwtPayload {
  userId: number;
}