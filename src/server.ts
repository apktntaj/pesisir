import { loadConfig } from './config';
import { TokenManager } from './utils/token';
import { createHttpClient } from './clients/http';
import { createRouter } from './routes';
import { logger } from './utils/logger';
import { version } from '../package.json';

const config = loadConfig();
const tokenManager = new TokenManager(config.tokenFilePath);
const httpClient = createHttpClient(config);
const router = createRouter(config, tokenManager, httpClient);

const server = Bun.serve({
  port: config.port,
  hostname: config.host,
  fetch: (request) => router.route(request),
});

logger.info('Server started', {
  version,
  port: config.port,
  host: config.host,
  lartasBaseUrl: config.lartasBaseUrl,
  tokenFilePath: config.tokenFilePath,
  authEnabled: config.apiKey !== null,
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
