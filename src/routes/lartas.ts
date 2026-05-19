import { AppError, successResponse } from '../utils/errors';
import { logger } from '../utils/logger';
import type { LartasService } from '../services/lartas';
import type { LartasRequest } from '../types';

const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

function validateLartasRequest(body: unknown): LartasRequest {
  if (!body || typeof body !== 'object') {
    throw new AppError(400, 'Request body must be a JSON object');
  }
  const req = body as Record<string, unknown>;
  if (!req.method || !ALLOWED_METHODS.includes(req.method as string)) {
    throw new AppError(400, `Invalid or missing method. Allowed: ${ALLOWED_METHODS.join(', ')}`);
  }
  if (!req.path || typeof req.path !== 'string') {
    throw new AppError(400, 'Missing or invalid path');
  }
  if (req.params !== undefined && (typeof req.params !== 'object' || req.params === null)) {
    throw new AppError(400, 'params must be an object');
  }
  return {
    method: req.method as LartasRequest['method'],
    path: req.path as string,
    params: req.params as Record<string, string> | undefined,
    body: req.body,
  };
}

export async function handleLartas(
  request: Request,
  lartasService: LartasService,
): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new AppError(400, 'Invalid JSON in request body');
  }

  const validated = validateLartasRequest(body);
  const result = await lartasService.proxyRequest(
    validated.method,
    validated.path,
    validated.body,
    validated.params,
  );

  logger.info('Lartas request completed', {
    method: validated.method,
    path: validated.path,
    upstreamStatus: result.status,
  });

  return successResponse(result);
}
