import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Request } from 'express';
import { ErrorCode } from '../common/error/error-codes';
import { NourishHttpException } from '../common/error/error-envelope';
import { AuthService } from './auth.service';

/** The authenticated caller, attached to the request by [AuthGuard]. */
export interface AuthenticatedRequest extends Request {
  auth?: { userId: string; sessionId: string };
}

/**
 * Bearer-token guard for account routes (AUTH-03).
 *
 * The access token is a short-lived JWT carrying only the user id and the
 * session id; authorisation data (plan, consent) is always read from the
 * database rather than trusted from the token.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization ?? '';
    const [scheme, token] = header.split(' ');

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new NourishHttpException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.UNAUTHENTICATED,
        'Sign in to continue.',
      );
    }

    request.auth = await this.auth.verifyAccessToken(token);
    return true;
  }
}
