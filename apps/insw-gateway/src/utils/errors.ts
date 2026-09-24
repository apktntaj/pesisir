import type { ApiResponse } from '../types';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorResponse(statusCode: number, message: string, details?: unknown): Response {
  const body: ApiResponse = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
  };
  if (details) body.data = details;
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function successResponse(data: unknown, statusCode = 200): Response {
  const body: ApiResponse = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}
