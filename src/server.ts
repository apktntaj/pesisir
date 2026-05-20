import { loadConfig } from './config';
import { TokenManager } from './utils/token';
import { createHttpClient } from './clients/http';
import { createLartasService } from './services/lartas';
import { handleHealth } from './routes/health';
import { handleTokenStatus } from './routes/token-status';
import { handleLartas } from './routes/lartas';
import { successResponse, errorResponse, AppError } from './utils/errors';
import { logger } from './utils/logger';
import { version } from '../package.json';

const cfg = loadConfig();
const tokenManager = new TokenManager(cfg.tokenFilePath);
const httpClient = createHttpClient(cfg);
const lartasService = createLartasService(httpClient, tokenManager, cfg);

function authenticate(request: Request): boolean {
    if (!cfg.apiKey) return true;
    return request.headers.get('x-api-key') === cfg.apiKey;
}

function withRequestLogging(handler: (request: Request) => Promise<Response> | Response) {
    return async (request: Request): Promise<Response> => {
        const url = new URL(request.url);
        const requestId = crypto.randomUUID();
        const startTime = performance.now();

        const logMeta = {
            requestId,
            method: request.method,
            path: url.pathname,
        };

        logger.info('Incoming request', logMeta);

        try {
            const response = await handler(request);
            logger.info('Request completed', {
                ...logMeta,
                status: response.status,
                duration: Math.round(performance.now() - startTime),
            });
            return response;
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
    };
}

const server = Bun.serve({
    port: cfg.port,
    hostname: cfg.host,
    routes: {
        '/health': {
            GET: withRequestLogging(() => successResponse(handleHealth())),
        },
        '/token-status': {
            GET: withRequestLogging(() => successResponse(handleTokenStatus(tokenManager))),
        },
        '/lartas': {
            POST: withRequestLogging(async (request: Request) => {
                if (!authenticate(request)) {
                    return errorResponse(401, 'Unauthorized. Provide valid x-api-key header');
                }
                return handleLartas(request, lartasService);
            }),
        },
    },
    fetch() {
        return errorResponse(404, 'Not found');
    },
});

logger.info('Server started', {
    version,
    port: cfg.port,
    host: cfg.host,
    lartasBaseUrl: cfg.lartasBaseUrl,
    tokenFilePath: cfg.tokenFilePath,
    authEnabled: cfg.apiKey !== null,
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down...');
    server.stop();
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down...');
    server.stop();
    process.exit(0);
});
