import { PrismaClient } from "@prisma/client/extension";
import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import type { UserObject } from "../types/api.js";
import type { CreateUpcomingBody, UpdateUpcomingBody } from "../types/api.js";
import { AppError } from "../utils/AppError.js";
const prisma = PrismaClient();
const router = Router();

// Extend request to expect a possible user object
interface AuthRequest extends Request {
  user?: UserObject;
}

// GET upcoming -> list of future sessions
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  // Extract user from request
  const { user } = req as AuthRequest;

  // Validate if user is logged in
  if (!user) {
    return next(new AppError(401, "Not authenticated", true));
  }

  try {
    //Get today's date
    const now = Date();

    //Fetch sessions with dates greater than today
    const sessions = await prisma.session.findMany({
      where: {
        user_id: user.id,
        start_at: {
          gte: now,
        },
        status: "SCHEDULED",
      },
      include: {
        tag: true,
      },
      orderBy: {
        start_at: "asc",
      },
    });

    if (!sessions) {
      return next(new AppError(404, "Cannot find sessions", true));
    }

    // Inline type for sessions returned with included tag
    type SessionWithTag = {
      id: string;
      name: string;
      start_at: Date;
      end_at: Date | null;
      status: string;
      break_time: number | null;
      tag: {
        id: string;
        name: string;
        color: string;
      };
    };

    const result = sessions.map((s: SessionWithTag) => ({
      id: s.id,
      name: s.name,
      start_at: s.start_at.toISOString(),
      end_at: s.end_at ? s.end_at.toISOString() : null,
      status: s.status,
      break_time: s.break_time,
      tag: {
        id: s.tag.id,
        name: s.tag.name,
        color: s.tag.color,
      },
    }));

    // Return the result to client
    return res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});
