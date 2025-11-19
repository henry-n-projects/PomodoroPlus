import { PrismaClient } from "@prisma/client";
import {
  Router,
  type NextFunction,
  type Response,
  type Request,
} from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { AppError } from "../utils/AppError.js";
import type { CreateSessionBody } from "../types/api.js";

const router = Router();
const prisma = new PrismaClient();

type AuthUser = {
  id: string;
};

//  CREATE SESSION
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  // 1. Insist that request contains a user object
  const user = (req as Request & { user?: AuthUser }).user;

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
        message: "start_time, end_time or tag_id missing.",
      });
    }

    // Turns valid date strings into numbers
    const startTime = new Date(body.start_at);
    const endTime = new Date(body.end_at);

    // Check if time strings are actual numbers
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return res.status(400).json({
        status: "error",
        message: "start_time or end_time invalid date.",
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
      status: "Success",
      message: "Created session",
      jsonObject: { session },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
