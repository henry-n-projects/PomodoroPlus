import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  //Defaults
  let statusCode = 500;
  let message = "Internal Server Error";
  // If in development show include error stack otherwise don't reveal error stack
  let stack = process.env.NODE_ENV === "development" ? err.stack : undefined;

  // Handle App error
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Handle Prisma error
  if (err.name === "PrisaClientKnownRequest") {
    statusCode = 400;
    message = "Database operation failed";
  }
  // Handle validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = err.message;
  }

  //Log error to console
  console.error("Error:", {
    statusCode,
    message,
    stack,
    timeStamp: new Date().toISOString(),
  });

  // Response body object
  const responseBody: any = {
    status: "error",
    message,
  };

  // Include stack to responseBody if in dev mode
  if (stack) {
    responseBody.stack = stack;
  }

  // Send response to client setting status and response info
  res.status(statusCode).json(responseBody);
};
