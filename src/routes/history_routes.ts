import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import type { UserObject } from "../types/api.js";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
const prisma = new PrismaClient();
const router = Router();

interface AuthRequest extends Request {
  user: UserObject;
}

// Helpers
function getDaysFromQuery(req: Request): number {
  const days = req.query.days;
  const num = typeof days === "string" ? Number(days) : NaN;
  if (!Number.isFinite(num) || num <= 0) {
    return 7;
  }
  return Math.min(num, 90);
}

function getRangeFromDays(days: number) {
  const now = new Date();

  const to = now;
  const from = new Date(now);

  from.setDate(from.getDate() - (days - 1));
  from.setHours(0, 0, 0, 0);
  return { to, from };
}
/**
 *
 * GET /API/HISTORY
 *
 * QUERY PARAMS:
 * - days?: number
 * - tagId : string
 */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  // Extract user from req
  const { user } = req as AuthRequest;

  if (!user) {
    return next(new AppError(401, "Not authenticated", true));
  }

  try {
    //extract query params
    const days = getDaysFromQuery(req);
    const { to, from } = getRangeFromDays(days);
    const tagId =
      typeof req.query.tagId === "string" ? req.query.tagId : undefined;

    // build db query that contains non optional values
    const where: any = {
      user_id: user.id,
      status: "COMPLETED",
      start_at: {
        gte: from,
        lt: to,
      },
    };

    // If tagId is provided add to where db query
    if (!tagId) {
      where.tagId = tagId;
    }

    // Retrieve filtered session
    const session = await prisma.session.findMany({
      where,
      include: {
        tag: true,
      },
      orderBy: {
        start_at: "asc",
      },
    });

    // Map session into array of objects for list
    const totalMinutes = 0;
    const list = await session.map((s) => {
      if (s.start_at && s.end_at) {
        const totalMinutes =
          (s.end_at.getTime() - s.start_at.getTime()) / 1000 / 60;
      }
      return {
        id: s.id,
        name: s.name,
        start_at: s.start_at,
        end_at: s.end_at,
        total_minutes: totalMinutes,
        break_time: s.break_time,
        tag: {
          id: s.tag.id,
          name: s.tag.name,
          color: s.tag.color,
        },
      };
    });

    // return response to client
    return res.status(200).json({
      status: "success",
      data: {
        range: {
          from: from.toISOString(),
          to: to.toISOString(),
          days,
        },
        sessions: list,
      },
    });
  } catch (err) {
    next(err);
  }
});
