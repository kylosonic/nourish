import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, AuthenticatedRequest } from './auth.guard';
import {
  AccountConsentView,
  AuthService,
} from './auth.service';
import { UpdateConsentDto } from './dto/auth.dto';
import { NourishHttpException } from '../common/error/error-envelope';
import { ErrorCode } from '../common/error/error-codes';

/**
 * Store-compliance account operations. The existing /v1/me route remains for
 * backwards compatibility; this resource owns consent and irreversible erasure.
 */
@Controller('account')
@UseGuards(AuthGuard)
export class AccountController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Get('consent')
  async consent(@Req() request: AuthenticatedRequest): Promise<AccountConsentView> {
    return this.auth.consentView(this.userId(request));
  }

  @Patch('consent')
  async updateConsent(
    @Req() request: AuthenticatedRequest,
    @Body() body: UpdateConsentDto,
  ): Promise<AccountConsentView> {
    return this.auth.updateConsents(this.userId(request), body);
  }

  /**
   * Irreversibly delete the account and all server-side health data. Database
   * relations cascade child records; the service also removes standalone OTP
   * history and account-linked analysis metadata in the same transaction.
   */
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Req() request: AuthenticatedRequest): Promise<void> {
    await this.auth.deleteAccount(this.userId(request));
  }

  private userId(request: AuthenticatedRequest): string {
    const userId = request.auth?.userId;
    if (!userId) {
      throw new NourishHttpException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.UNAUTHENTICATED,
        'Sign in to continue.',
      );
    }
    return userId;
  }
}
