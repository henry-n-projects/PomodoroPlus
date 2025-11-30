import { PrismaClient } from "@prisma/client";
import Router from "../libs/prisma.js";
import type { Request } from "express";
import type { UserObject } from "../types/api.js";
// Prisma client instance + shared router instance
const prisma = new PrismaClient();
const router = Router;

// Extend request to expect user in request
interface AuthRequest extends Request {
  user?: UserObject;
}

// Helper: parse days from query max 90
function getDaysFromQuery(req: Request): number {
  // read the query value
  const query = req.query.days;

  // convert query value to number if its a string
  const num = typeof query === "string" ? Number(query) : NaN;

  // if num is invalid (NaN, infinity) < 0 than return default (7)
  if (!Number.isFinite(num) || num <= 0) return 7;

  return Math.min(num, 90);
}

// Helper: get from and to range
function getRangeFromDays(days: number) {
  const now = new Date();
  const to = now; // Todays date
  const from = new Date(now);
  from.setDate(from.getDate() - (days - 1)); // from Date
  from.setHours(0, 0, 0, 0);
  return { from, to }; //return to and from dates
}

// Helper: normailise Date to yyyy-mm-dd
function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}
