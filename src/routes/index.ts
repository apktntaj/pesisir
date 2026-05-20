import type { Config } from '../config';
import type { TokenManager } from '../utils/token';
import type { HttpClient } from '../clients/http';
import type { LartasService } from '../services/lartas';

import { createLartasService } from '../services/lartas';
import { setStartTime, handleHealth } from './health';
import { handleTokenStatus } from './token-status';
import { handleLartas } from './lartas';
import { handleUpdateToken } from './admin';
import { successResponse, errorResponse, AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export function createRouter(c: Config, t: TokenManager, h: HttpClient) {
    setStartTime(Date.now());
    const lartasService: LartasService = createLartasService(h, t, c);

    function authenticate(request: Request): boolean {
        if (!c.apiKey) return true;
        const key = request.headers.get('x-api-key');
        return key === c.apiKey;
    }

    function authenticateAdmin(request: Request): boolean {
        if (!c.adminKey) return true;
        const key = request.headers.get('x-admin-key');
        return key === c.adminKey;
    }

    async function route(request: Request): Promise<Response> {
        const url = new URL(request.url);
        const method = request.method;
        const startTime = performance.now();
        const requestId = crypto.randomUUID();

        const logMeta = {
            requestId,
            method,
            path: url.pathname,
        };

        logger.info('Incoming request', logMeta);

        try {
            // Health check - no auth required
            if (method === 'GET' && url.pathname === '/health') {
                const response = successResponse(handleHealth());
                logger.info('Request completed', { ...logMeta, status: 200, duration: Math.round(performance.now() - startTime) });
                return response;
            }

            // Token status - no auth required (no sensitive data exposed)
            if (method === 'GET' && url.pathname === '/token-status') {
                const response = successResponse(handleTokenStatus(t));
                logger.info('Request completed', { ...logMeta, status: 200, duration: Math.round(performance.now() - startTime) });
                return response;
            }

            // Lartas proxy - requires auth if configured
            if (method === 'POST' && url.pathname === '/lartas') {
                if (!authenticate(request)) {
                    logger.warn('Authentication failed', logMeta);
                    return errorResponse(401, 'Unauthorized. Provide valid x-api-key header');
                }
                const response = await handleLartas(request, lartasService);
                logger.info('Request completed', { ...logMeta, status: 200, duration: Math.round(performance.now() - startTime) });
                return response;
            }

            // Admin: update token
            if (method === 'POST' && url.pathname === '/admin/token') {
                if (!authenticateAdmin(request)) {
                    logger.warn('Admin authentication failed', logMeta);
                    return errorResponse(401, 'Unauthorized. Provide valid x-admin-key header');
                }
                const response = await handleUpdateToken(request, t);
                logger.info('Request completed', { ...logMeta, status: 200, duration: Math.round(performance.now() - startTime) });
                return response;
            }

            logger.warn('Route not found', logMeta);
            return errorResponse(404, 'Not found');
        } catch (error) {
            if (error instanceof AppError) {
                logger.warn('Request failed', {
                    ...logMeta,
                    status: error.statusCode,
                    error: error.message,
                });
                return errorResponse(error.statusCode, error.message, error.details);
            }
            const message = error instanceof Error ? error.message : String(error);
            logger.error('Unhandled error', { ...logMeta, error: message });
            return errorResponse(500, 'Internal server error');
        }
    }

    return { route };
}
