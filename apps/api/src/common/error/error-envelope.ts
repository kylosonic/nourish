import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-codes';

/** Standard v1 error envelope shape: { error: { code, message, requestId } }. */
export interface ErrorEnvelope {
  error: {
    code: ErrorCode;
    message: string;
    requestId: string;
  };
}

/**
 * Nest exception carrying a v1 error envelope. The global filter renders it;
 * controllers throw it directly for domain errors (e.g. FOOD_NOT_FOUND).
 */
export class NourishHttpException extends HttpException {
  constructor(
    status: HttpStatus,
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message, status);
  }
}
