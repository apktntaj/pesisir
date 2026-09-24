import type { TokenStatusResponse } from '../types';
import type { TokenManager } from '../utils/token';

export function handleTokenStatus(tokenManager: TokenManager): TokenStatusResponse {
  const exists = tokenManager.exists();
  return {
    exists,
    maskedToken: tokenManager.masked(),
  };
}
