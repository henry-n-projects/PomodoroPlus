import { Prisma } from "@prisma/client";
import { Router } from "express";
import type { UserObject } from "../types/api.js";
import type { Request } from "express";
const prisma = Prisma;
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
  return { now, from };
}
