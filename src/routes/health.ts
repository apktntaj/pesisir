import type { HealthResponse } from '../types';
import { formatUptimeHuman } from '../domain/uptime';

let startTime = Date.now();

export function setStartTime(time: number) {
  startTime = time;
}

export function handleHealth(): HealthResponse {
  const uptime = Date.now() - startTime;

  return {
    status: 'ok',
    uptime,
    uptimeHuman: formatUptimeHuman(uptime),
    version: '1.0.0',
  };
}
