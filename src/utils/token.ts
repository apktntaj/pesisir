import { readFileSync, existsSync } from 'node:fs';
import { logger } from './logger';

export class TokenManager {
  private token: string | null = null;
  private prevToken: string | null = null;
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.load();
  }

  private load(): void {
    try {
      if (!existsSync(this.filePath)) {
        this.token = null;
        this.prevToken = null;
        logger.warn('Token file not found', { path: this.filePath });
        return;
      }
      const content = readFileSync(this.filePath, 'utf-8').trim();
      if (content.length === 0) {
        this.token = null;
        this.prevToken = null;
        logger.warn('Token file is empty', { path: this.filePath });
        return;
      }
      if (content !== this.prevToken) {
        this.token = content;
        this.prevToken = content;
        logger.info('Token loaded successfully');
      }
    } catch (error) {
      this.token = null;
      this.prevToken = null;
      logger.error('Failed to read token file', {
        path: this.filePath,
        error: String(error),
      });
    }
  }

  get(): string | null {
    this.load();
    return this.token;
  }

  exists(): boolean {
    return this.get() !== null;
  }

  masked(): string | null {
    const t = this.get();
    if (!t) return null;
    if (t.length <= 8) return t.slice(0, 2) + '****';
    return t.slice(0, 4) + '****' + t.slice(-4);
  }

  reload(): boolean {
    this.prevToken = null;
    this.load();
    return this.token !== null;
  }
}
