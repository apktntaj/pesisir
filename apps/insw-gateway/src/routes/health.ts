import type { HealthResponse } from '../types';

let startTime = Date.now();

export function setStartTime(time: number) {
  startTime = time;
}

export function handleHealth(): HealthResponse {
  const uptime = Date.now() - startTime;
  const seconds = Math.floor(uptime / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return {
    status: 'ok',
    uptime,
    uptimeHuman: parts.join(' '),
    version: '1.0.0',
  };
}
