import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import type { Config } from '../config';

export function createHttpClient(config: Config) {
  const { requestTimeoutMs, maxRetries } = config;

  async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function request(url: string, options: RequestInit = {}): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetchWithTimeout(url, options);
        if (response.ok || attempt === maxRetries) {
          return response;
        }
        if (response.status >= 400 && response.status < 500) {
          return response;
        }
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          lastError = new AppError(504, `Upstream timed out after ${requestTimeoutMs}ms`);
        } else {
          lastError = error instanceof Error ? error : new Error(String(error));
        }
        if (attempt < maxRetries) {
          const backoff = Math.pow(2, attempt) * 200;
          logger.warn('Request failed, retrying', {
            url,
            attempt: attempt + 1,
            maxRetries,
            backoffMs: backoff,
            error: lastError.message,
          });
          await new Promise((resolve) => setTimeout(resolve, backoff));
        }
      }
    }

    throw new AppError(502, `Upstream request failed: ${lastError?.message || 'Unknown error'}`);
  }

  return { request };
}

export type HttpClient = ReturnType<typeof createHttpClient>;
