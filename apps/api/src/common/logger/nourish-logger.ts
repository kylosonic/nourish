import { Logger } from '@nestjs/common';

/** Structured log categories used across the API (blueprint §14). */
export type LogCategory =
  | 'import'
  | 'foods.search'
  | 'catalog'
  | 'bootstrap'
  | 'catalog-sync'
  // S2: analysis (never logs the prompt, the image or a provider body).
  | 'analysis'
  // S3: accounts. Never logs a phone number, a code or a token — only ids and
  // counts, so a log leak cannot become an account takeover.
  | 'auth'
  | 'sync';

/**
 * Thin wrapper around the Nest Logger that enforces the category set and a
 * stable message prefix.
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
