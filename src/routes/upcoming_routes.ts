import { PrismaClient } from "@prisma/client/extension";
import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import type { UserObject } from "../types/api.js";
import type { CreateUpcomingBody, UpdateUpcomingBody } from "../types/api.js";
import { AppError } from "../utils/AppError.js";
import { SessionStatus } from "@prisma/client";
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

//POST create a new upcoming session (status = SCHEDULED)
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  // Extract user from request
  const { user } = req as AuthRequest;

  //Validate that user is logged in
  if (!user) {
    return next(new AppError(401, "Not authenticated", true));
  }

  try {
    // Type assertion for payload from client
    const body = req.body as CreateUpcomingBody;

    // Validate required fields exist
    if (!body.start_at) {
      return res.status(400).json({
        status: "error",
        message: "start_at is missing",
      });
    }
    const now = new Date();
    //Convert start_at and end_at to date type
    const startAt = new Date(body.start_at);
    const endAt = body.end_at ? new Date(now) : null;

    // Validate date is in correct format
    if (isNaN(startAt.getTime()) || (endAt && isNaN(endAt.getTime()))) {
      return res.status(400).json({
        status: "error",
        message: "start_at and end_at is in invalid format",
      });
    }

    //Handle tag creation or selection
    let tagId = body.tag_id;

    // If user creates a new tag instead of choosing existing tag
    if (!tagId && body.new_tag_name && body.new_tag_color) {
      const newTag = await prisma.tag.create({
        data: {
          user_id: user.id,
          name: body.new_tag_name,
          color: body.new_tag_color,
          created_at: new Date(),
        },
      });

      tagId = newTag.id;
    }

    // If still no tagId → invalid
    if (!tagId) {
      return res.status(400).json({
        status: "error",
        message: "tag_id or new_tag_name/new_tag_color must be provided",
      });
    }

    // Update session in db
    const session = prisma.session.create({
      data: {
        user_id: user.id,
        name: body.name,
        start_at: startAt,
        end_at: endAt,
        break_time: 0,
        status: SessionStatus.SCHEDULED,
        tag_id: body.tag_id,
      },
      include: {
        tag: true,
      },
    });

    return res.status(201).json({
      status: "success",
      data: {
        id: session.id,
        name: session.name,
        start_at: session.start_at.toISOString(),
        end_at: session.end_at ? session.end_at.toISOString() : null,
        status: session.status,
        break_time: session.break_time,
        tag: {
          id: session.tag.id,
          name: session.tag.name,
          color: session.tag.color,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});
