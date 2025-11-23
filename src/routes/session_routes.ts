import prisma from "../libs/prisma.js";
import {
  Router,
  type NextFunction,
  type Response,
  type Request,
} from "express";
import { AppError } from "../utils/AppError.js";
import type { CreateSessionBody, UserObject } from "../types/api.js";
import { SessionStatus, type Session } from "@prisma/client";
import { error } from "console";
import { appendFile } from "fs";

const router = Router();

interface AuthRequest extends Request {
  user?: UserObject;
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

//GET scheduled sessions to start from
router.get(
  "/scheduled",
  async (req: Request, res: Response, next: NextFunction) => {
    // Store the user from the client response
    const { user } = req as AuthRequest;

    // 1. Validate the user is logged in
    if (!user) {
      return next(new AppError(401, "Not authenticated", true));
    }

    //2. Try fetch scheduled schedules
    try {
      const now = new Date();

      //Query db for sessions status 'scheduled'
      const sessions = await prisma.session.findMany({
        where: {
          user_id: user.id,
          status: SessionStatus.SCHEDULED,
          start_at: {
            gte: now,
          },
        },
        include: {
          tag: true,
        },
        orderBy: {
          start_at: "asc",
        },
      });

      // Create an array of session obejcts from fetch result
      const result = sessions.map((s) => ({
        id: s.id,
        name: s.name,
        start_at: s.start_at,
        end_at: s.end_at,
        status: s.status,
        break_time: s.break_time,
        tag: {
          id: s.tag.id,
          name: s.tag.name,
          color: s.tag.color,
        },
      }));

      // Send response to client
      res.status(200).json({
        status: "success",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST start session: scheduled -> in progress, set start time
router.post(
  "/:id/start",
  async (req: Request, res: Response, next: NextFunction) => {
    // Store user from client response
    const { user } = req as AuthRequest;

    // 1. Validate user is logged in
    if (!user) {
      return next(new AppError(401, "Not authenticated", true));
    }

    try {
      // 2. Extract session id from url
      const id = req.params.id;

      if (!id) {
        return next(new AppError(400, "Session id missing", true));
      }

      const now = new Date();

      // 3. Fetch scheduled session and validate session belongs to user
      const session = await prisma.session.findFirst({
        where: {
          id: id,
          user_id: user.id,
        },
      });

      if (!session) {
        return next(new AppError(404, "Session not found", true));
      }

      // 4. Validate that session is scheduled
      if (session.status !== "SCHEDULED") {
        next(new AppError(400, "Only scheduled sessions can be started", true));
      }

      // 5. Update session: status=scheduled -> start time=now
      const updated = await prisma.session.update({
        where: { id: session.id },
        data: {
          status: "IN_PROGRESS",
          start_at: now, // actual start time
          end_at: null, // clear any previous end time, just in case
          break_time: 0, // reset break time if needed
        },
      });

      // 6. Return response to client
      return res.status(200).json({
        status: "success",
        data: {
          id: updated.id,
          status: updated.status,
          start_at: updated.start_at.toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

//POST stop session
router.post(
  "/:id/stop",
  async (req: Request, res: Response, next: NextFunction) => {
    // 1. Extract user from req
    const { user } = req as AuthRequest;

    // 2. Validate the user is logged in
    if (!user) {
      return next(new AppError(401, "Not authenticated", true));
    }

    try {
      // 3. Extract url param
      const { id } = req.params;

      const now = new Date();

      if (!id) {
        return next(new AppError(400, "Session id missing", true));
      }

      // 4. Validate session belongs to user
      const session = await prisma.session.findFirst({
        where: {
          id: id,
          user_id: user.id,
        },
      });

      // 5. Validate session is in progress
      if (session?.status !== "IN_PROGRESS") {
        return next(
          new AppError(400, "Only sessions in progress can be stopped", true)
        );
      }

      // 6. Update session to be completed
      const updated = await prisma.session.update({
        where: {
          id: session.id,
        },
        data: {
          status: "COMPLETED",
          end_at: now,
        },
      });

      // 7. Return response to client
      return res.status(200).json({
        status: "success",
        data: {
          session: {
            id: updated.id,
            status: updated.status,
            start_at: updated.start_at.toISOString(),
            end_at: updated.end_at?.toISOString() ?? null,
            break_time: updated.break_time,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

//POST start break
router.post(
  "/:id/breaks/start",
  async (req: Request, res: Response, next: NextFunction) => {
    // Extract user from req
    const { user } = req as AuthRequest;

    // Validate user is logged in
    if (!user) {
      return next(new AppError(401, "Not authenticated", true));
    }

    try {
      // Extract the url params
      const { id } = req.params;

      if (!id) {
        return next(new AppError(400, "Session id missing", true));
      }
      const now = new Date();
      const { type } = req.body as { type?: string };

      // Fetch session
      const session = await prisma.session.findFirst({
        where: {
          id: id,
          user_id: user.id,
        },
      });

      // Validate it exists and is scheduled
      if (!session) {
        return next(new AppError(404, "Session not found", true));
      }

      if (session.status !== "IN_PROGRESS") {
        return next(
          new AppError(400, "Can only start break on active sessions", true)
        );
      }

      // Fetch break
      const activeBreak = await prisma.break.findFirst({
        where: {
          session_id: session.id,
          end_time: null,
        },
      });
      // Validate no active break
      if (!activeBreak) {
        return next(
          new AppError(400, "An active break is already in progress", true)
        );
      }

      // Check for valid type in req
      const breakType =
        type && ["SHORT", "LONG", "CUSTOM"].includes(type) ? type : "CUSTOM";

      // Create break entry
      const newBreak = await prisma.break.create({
        data: {
          session_id: session.id,
          type: breakType,
          start_time: now,
          end_time: null,
        },
      });

      // Return response to client
      return res.status(201).json({
        status: "success",
        data: {
          break: {
            id: newBreak.id,
            type: newBreak.type,
            start_time: newBreak.start_time.toISOString(),
            end_time: newBreak.end_time,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }
);
export default router;
