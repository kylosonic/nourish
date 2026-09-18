import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Observable, tap } from 'rxjs';
import { Response } from 'express';

/**
 * Echoes a caller-supplied X-Request-Id (or generates one) on every response,
 * so error envelopes and successful responses share the same correlation id
 * (blueprint §14). The exception filter performs the same echo for errors.
 */
@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<{ headers?: Record<string, string> }>();
    const response = http.getResponse<Response>();

    const requestId =
      request?.headers?.['x-request-id'] ?? request?.headers?.['X-Request-Id'] ?? randomUUID();
    response.setHeader('X-Request-Id', requestId);

    return next.handle().pipe(
      tap(() => {
        response.setHeader('X-Request-Id', requestId);
      }),
    );
  }
}
