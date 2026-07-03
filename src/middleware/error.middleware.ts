import { Request, Response, NextFunction } from "express";
import { APIError, generateAPIError } from "../utils/apiError";

export function notFoundHandler(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  next(generateAPIError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const isApiError = err instanceof APIError;
  const statusCode = isApiError ? err.statusCode : 500;
  const message =
    err instanceof Error ? err.message : "Internal Server Error";

  if (!isApiError) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    data: isApiError ? err.data : undefined,
  });
}
