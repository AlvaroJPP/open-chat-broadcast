import type { ErrorRequestHandler, RequestHandler, Response } from "express";

interface HttpError extends Error {
  status?: number;
}

declare const http: {
  success(res: Response, data?: unknown, status?: number): Response;
  created(res: Response, data?: unknown): Response;
  badRequest(res: Response, message?: string): Response;
  unauthorized(res: Response, message?: string): Response;
  forbidden(res: Response, message?: string): Response;
  notFound(res: Response, message?: string): Response;
  conflict(res: Response, message?: string): Response;
  internal(res: Response, message?: string): Response;
  error(res: Response, error: HttpError): Response;
  asyncHandler(handler: RequestHandler): RequestHandler;
  errorHandler: ErrorRequestHandler;
  notFoundHandler: RequestHandler;
  ipFilter: RequestHandler;
};

export default http;
