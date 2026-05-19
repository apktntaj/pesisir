import { loadConfig } from './config';
import { TokenManager } from './utils/token';
import { createHttpClient } from './clients/http';
import { createRouter } from './routes';
import { logger } from './utils/logger';
import { version } from '../package.json';

const cfg = loadConfig();
const tokenManager = new TokenManager(cfg.tokenFilePath);
const httpClient = createHttpClient(cfg);
const router = createRouter(cfg, tokenManager, httpClient);

const server = Bun.serve({
    port: cfg.port,
    hostname: cfg.host,
    fetch: (request) => router.route(request),
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
