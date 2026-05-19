export interface Config {
  port: number;
  host: string;
  lartasBaseUrl: string;
  tokenFilePath: string;
  requestTimeoutMs: number;
  maxRetries: number;
  logLevel: string;
  apiKey: string | null;
}

function envToInt(key: string, fallback: number): number {
  const val = Bun.env[key];

  if (!val) return fallback;
  const parsed = parseInt(val, 10);
  if (isNaN(parsed)) return fallback;
  return parsed;
}

export function loadConfig(): Config {
  return {
    port: envToInt('PORT', 3001),
    host: Bun.env.HOST || '0.0.0.0',
    lartasBaseUrl: Bun.env.LARTAS_BASE_URL || 'https://api.lartas.go.id',
    tokenFilePath: Bun.env.TOKEN_FILE_PATH || './token.txt',
    requestTimeoutMs: envToInt('REQUEST_TIMEOUT_MS', 30000),
    maxRetries: envToInt('MAX_RETRIES', 3),
    logLevel: Bun.env.LOG_LEVEL || 'info',
    apiKey: Bun.env.API_KEY || null,
  };
}
