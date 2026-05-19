import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import type { TokenManager } from '../utils/token';
import type { HttpClient } from '../clients/http';
import type { Config } from '../config';
import type { LartasProxyResponse } from '../types';

export function createLartasService(
  httpClient: HttpClient,
  tokenManager: TokenManager,
  config: Config,
) {
  async function proxyRequest(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string>,
  ): Promise<LartasProxyResponse> {
    const token = tokenManager.get();
    if (!token) {
      throw new AppError(503, 'Token not available. Set token in token.txt');
    }

    const baseUrl = config.lartasBaseUrl.replace(/\/+$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(cleanPath, baseUrl);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Basic ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      Origin: 'https://insw.go.id',
      Referer: 'https://insw.go.id/',
    };

    logger.info('Proxying request to LarTas API', {
      method,
      path: url.toString(),
    });

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (body && method !== 'GET' && method !== 'HEAD') {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await httpClient.request(url.toString(), fetchOptions);

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      if (['content-type', 'content-length', 'x-request-id'].includes(key.toLowerCase())) {
        responseHeaders[key] = value;
      }
    });

    let data: unknown;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    logger.info('LarTas API response received', {
      status: response.status,
    });

    return {
      status: response.status,
      headers: responseHeaders,
      data,
    };
  }

  return { proxyRequest };
}

export type LartasService = ReturnType<typeof createLartasService>;
