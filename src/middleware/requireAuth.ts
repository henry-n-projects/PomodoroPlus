//middle wear that blocks request

import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";

interface AuthRequest extends Request {
  user?: { id: string };
}

//2. Middleware to throw error if user is not set in the request / logged in
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError(401, "Not Authenticated", true));
  }
  next();
};
