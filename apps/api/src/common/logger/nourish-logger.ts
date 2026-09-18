import { Logger } from '@nestjs/common';

/** Structured log categories used across the API (blueprint §14). */
export type LogCategory = 'import' | 'foods.search' | 'catalog' | 'bootstrap' | 'catalog-sync';

/**
 * Thin wrapper around the Nest Logger that enforces the S1 category set and a
 * stable message prefix. No PII exists to leak in S1 (public catalog only).
 */
export class NourishLogger {
  private readonly logger: Logger;

  constructor(category: LogCategory) {
    this.logger = new Logger(category);
  }

  log(message: string, meta?: unknown): void {
    this.logger.log(meta === undefined ? message : `${message} ${JSON.stringify(meta)}`);
  }

  warn(message: string, meta?: unknown): void {
    this.logger.warn(meta === undefined ? message : `${message} ${JSON.stringify(meta)}`);
  }

  error(message: string, meta?: unknown): void {
    this.logger.error(meta === undefined ? message : `${message} ${JSON.stringify(meta)}`);
  }
}
