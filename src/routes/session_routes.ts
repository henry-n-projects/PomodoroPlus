import prisma from "../libs/prisma.js";
import {
  Router,
  type NextFunction,
  type Response,
  type Request,
} from "express";
import { AppError } from "../utils/AppError.js";
import type { CreateSessionBody, SessionObject } from "../types/api.js";
import type { Session, SessionStatus } from "@prisma/client";

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

//  CREATE SESSION
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  // 1. Cast request to add a user object
  const user = (req as AuthRequest).user;

  try {
    if (!user) {
      return next(new AppError(401, "Not authenticated", true));
    }

    // 2. Ensure type on request body
    const body = req.body as CreateSessionBody;

    // 3. Validate response from client
    if (!body.end_at || !body.start_at || !body.tag_id || !body.name) {
      return res.status(400).json({
        status: "error",
        message: "start_at, end_at or tag_id missing.",
      });
    }

    // Turns valid date strings into numbers
    const startAt = new Date(body.start_at);
    const endAt = new Date(body.end_at);

    // Check if time strings are actual numbers
    if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) {
      return res.status(400).json({
        status: "error",
        message: "start_at or end_at invalid date.",
      });
    }

    // 4. Create session into sessions table
    const created = await prisma.session.create({
      data: {
        user_id: user.id,
        name: body.name ?? "",
        start_at: startAt,
        end_at: endAt ?? null,
        break_time: body.break_time,
        status: body.status as SessionStatus,
        created_at: new Date(),
        tag_id: body.tag_id,
      },
    });

    return res.status(201).json({
      status: "success",
      data: created,
    });
  } catch (err) {
    next(err);
  }
});

// GET SESSION
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as AuthRequest).user;

  // 1. Check if user is logged in.
  if (!user) {
    return next(new AppError(401, "Not Authenticated", true));
  }
  try {
    // 2. Find sessions in DB
    const result = await prisma.session.findMany({
      where: {
        user_id: user.id,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // 3. Map prisma result into session object
    const sessions: SessionObject[] = result.map((session: Session) => ({
      id: session.id,
      user_id: session.user_id,
      name: session.name ?? "",
      start_at: session.start_at.toISOString(),
      end_at: session.end_at?.toISOString() ?? "",
      break_time: session.break_time,
      status: session.status,
      created_at: session.created_at.toISOString(),
      tag_id: session.tag_id,
    }));

    // 4. Return data to client
    return res.status(200).json({
      status: "success",
      sessions,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
