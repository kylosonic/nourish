import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { randomUUID } from 'node:crypto';
import { Response } from 'express';
import { ErrorCode } from '../error/error-codes';
import { NourishHttpException } from '../error/error-envelope';
import { NourishLogger } from '../logger/nourish-logger';

/**
 * Global exception filter: renders every error as the v1 envelope
 * { error: { code, message, requestId } } (blueprint §8). 5xx messages are
 * sanitized — no stack traces, no SQL, no internals ever reach the client.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new NourishLogger('bootstrap');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<{ headers?: Record<string, string> }>();
    const response = ctx.getResponse<Response>();

    const requestId =
      request?.headers?.['x-request-id'] ?? request?.headers?.['X-Request-Id'] ?? randomUUID();
    response.setHeader('X-Request-Id', requestId);

    let status: HttpStatus;
    let code: ErrorCode;
    let message: string;

    if (exception instanceof NourishHttpException) {
      status = exception.getStatus();
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof ThrottlerException) {
      status = HttpStatus.TOO_MANY_REQUESTS;
      code = ErrorCode.RATE_LIMITED;
      message = 'Too many requests. Please slow down.';
    } else if (exception instanceof NotFoundException) {
      status = HttpStatus.NOT_FOUND;
      code = ErrorCode.FOOD_NOT_FOUND;
      message = exception.message || 'Not found';
    } else if (exception instanceof BadRequestException) {
      status = HttpStatus.BAD_REQUEST;
      code = ErrorCode.VALIDATION_ERROR;
      message = this.describeBadRequest(exception);
    } else if (exception instanceof HttpException) {
      const s = exception.getStatus();
      if (s === 429) {
        status = s;
        code = ErrorCode.RATE_LIMITED;
        message = 'Too many requests. Please slow down.';
      } else if (s === 404) {
        status = s;
        code = ErrorCode.FOOD_NOT_FOUND;
        message = exception.message || 'Not found';
      } else if (s >= 400 && s < 500) {
        status = s;
        code = ErrorCode.VALIDATION_ERROR;
        message = exception.message;
      } else {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        code = ErrorCode.INTERNAL;
        message = 'Internal server error';
        this.logger.error(`unhandled ${s} ${exception.message}`);
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = ErrorCode.INTERNAL;
      message = 'Internal server error';
      this.logger.error(
        `unhandled exception: ${exception instanceof Error ? exception.message : String(exception)}`,
      );
    }

    response.status(status).json({
      error: { code, message, requestId },
    });
  }

  /** Render class-validator field errors into a single readable message. */
  private describeBadRequest(exception: BadRequestException): string {
    const body = exception.getResponse();
    if (typeof body === 'string') return body;
    if (typeof body === 'object' && body !== null && Array.isArray((body as { message?: unknown }).message)) {
      const messages = (body as { message: unknown[] }).message;
      return messages.map((m) => (typeof m === 'string' ? m : JSON.stringify(m))).join('; ');
    }
    return exception.message;
  }
}
