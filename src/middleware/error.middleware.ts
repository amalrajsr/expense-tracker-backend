import { Request, Response, NextFunction } from "express";
import { APIError, generateAPIError } from "../utils/apiError";

type HttpError = Error & {
  status?: number;
  statusCode?: number;
  type?: string;
};

export function notFoundHandler(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  next(
    generateAPIError(`Route not found: ${req.method} ${req.originalUrl}`, 404),
  );
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const isApiError = err instanceof APIError;
  const httpError = err as HttpError;
  const statusCode = isApiError
    ? err.statusCode
    : httpError.statusCode ?? httpError.status ?? 500;
  const safeStatusCode =
    Number.isInteger(statusCode) && statusCode >= 400 && statusCode < 600
      ? statusCode
      : 500;

  let message = "Internal Server Error";

  if (isApiError) {
    message = err.message;
  } else if (safeStatusCode === 400 && httpError.type === "entity.parse.failed") {
    message = "Invalid JSON payload";
  } else if (safeStatusCode === 413) {
    message = "Request body too large";
  } else if (safeStatusCode >= 400 && safeStatusCode < 500) {
    message = "Bad request";
  }

  if (!isApiError) {
    console.error(err);
  }

  res.status(safeStatusCode).json({
    success: false,
    message,
    ...(isApiError && err.details ? { details: err.details } : {}),
  });
}
