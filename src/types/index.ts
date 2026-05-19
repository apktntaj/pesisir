export interface LartasRequest {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  params?: Record<string, string>;
  body?: unknown;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface HealthResponse {
  status: 'ok' | 'degraded';
  uptime: number;
  uptimeHuman: string;
  version: string;
}

export interface TokenStatusResponse {
  exists: boolean;
  maskedToken: string | null;
}

export interface LartasProxyResponse {
  status: number;
  headers: Record<string, string>;
  data: unknown;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
