import { PrismaClient } from "@prisma/client";
import {
  Router,
  type NextFunction,
  type Response,
  type Request,
} from "express";
import { AppError } from "../utils/AppError.js";
import type { CreateSessionBody, SessionObject } from "../types/api.js";

const router = Router();
const prisma = new PrismaClient();

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
    if (!body.end_at || !body.start_at || !body.tag_id) {
      return res.status(400).json({
        status: "error",
        message: "start_at, end_at or tag_id missing.",
      });
    }

    // Turns valid date strings into numbers
    const startTime = new Date(body.start_at);
    const endTime = new Date(body.end_at);

    // Check if time strings are actual numbers
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return res.status(400).json({
        status: "error",
        message: "start_at or end_at invalid date.",
      });
    }

    // 4. Create session into sessions table
    const session = await prisma.session.create({
      data: {
        user_id: user.id,
        start_at: startTime,
        end_at: endTime,
        break_time: body.break_time ?? 0,
        completed: body.completed ?? false,
        created_at: new Date(),
        tag_id: body.tag_id,
      },
    });

    return res.status(201).json({
      status: "success",
      data: { session },
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
    // 2. Find sessions in DB for user
    const sessions = await prisma.session.findMany({
      where: {
        user_id: user.id,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // 3. Map prisma result into session object
    const result: SessionObject[] = sessions.map((session) => ({
      id: session.id,
      user_id: session.user_id,
      start_at: session.start_at.toISOString(),
      end_at: session.end_at.toISOString(),
      break_time: session.break_time,
      completed: session.completed,
      created_at: session.created_at.toISOString(),
      tag_id: session.tag_id,
    }));

    return res.status(200).json({
      status: "success",
      data: { result },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
