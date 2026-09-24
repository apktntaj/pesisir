import { AppError, successResponse } from '../utils/errors';
import type { TokenManager } from '../utils/token';
import { logger } from '../utils/logger';

export async function handleUpdateToken(
  request: Request,
  tokenManager: TokenManager,
): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    throw new AppError(400, 'Invalid JSON');
  }

  const rawToken = body.token;
  if (!rawToken || typeof rawToken !== 'string' || rawToken.trim().length === 0) {
    throw new AppError(400, 'Missing or invalid token');
  }

  tokenManager.set(rawToken.trim());

  logger.info('Token updated via admin endpoint');

  return successResponse({
    message: 'Token updated successfully',
    maskedToken: tokenManager.masked(),
  });
}
