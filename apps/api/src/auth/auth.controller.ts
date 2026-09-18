import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Inject } from '@nestjs/common';
import { ErrorCode } from '../common/error/error-codes';
import { NourishHttpException } from '../common/error/error-envelope';
import { AuthGuard, AuthenticatedRequest } from './auth.guard';
import { AuthRepository } from './auth.repository';
import { AccountView, AuthService, OtpRequestResult, SessionTokens } from './auth.service';
import { RefreshTokenDto, RequestOtpDto, VerifyOtpDto } from './dto/auth.dto';

/**
 * Account surface (S3, ADR-0008).
 *
 * `request` is deliberately tight: each call costs an SMS, so it is limited far
 * below the global read bucket and below the analysis bucket. The limits are
 * read from the environment when this module is first imported (the decorator is
 * evaluated at class-definition time), so an operator can tune them; the
 * defaults are the shipped production ceilings.
 */
export const OTP_REQUEST_RATE_LIMIT = {
  limit: Number(process.env.OTP_REQUEST_RATE_LIMIT ?? 5),
  ttl: Number(process.env.OTP_RATE_LIMIT_TTL_MS ?? 60000),
} as const;
export const OTP_VERIFY_RATE_LIMIT = {
  limit: Number(process.env.OTP_VERIFY_RATE_LIMIT ?? 10),
  ttl: Number(process.env.OTP_RATE_LIMIT_TTL_MS ?? 60000),
} as const;

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  /** AUTH-02: send a one-time code. The code is never in the response. */
  @Post('otp')
  @Throttle({ default: OTP_REQUEST_RATE_LIMIT })
  @HttpCode(HttpStatus.ACCEPTED)
  async requestOtp(@Body() body: RequestOtpDto): Promise<OtpRequestResult> {
    return this.auth.requestOtp(body.phone);
  }

  /** AUTH-02: exchange the code for a session (creating the account if new). */
  @Post('otp/verify')
  @Throttle({ default: OTP_VERIFY_RATE_LIMIT })
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body() body: VerifyOtpDto,
    @Headers('user-agent') userAgent?: string,
  ): Promise<{ tokens: SessionTokens; account: AccountView; created: boolean }> {
    return this.auth.verifyOtp(body.phone, body.code, userAgent);
  }

  /** AUTH-03: rotate the refresh credential. The old one stops working. */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() body: RefreshTokenDto,
    @Headers('user-agent') userAgent?: string,
  ): Promise<{ tokens: SessionTokens }> {
    return { tokens: await this.auth.refresh(body.refreshToken, userAgent) };
  }

  /** AUTH-03: end this device's session. Idempotent. */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() body: RefreshTokenDto): Promise<void> {
    await this.auth.logout(body.refreshToken);
  }
}

/** The signed-in user's own record. */
@Controller('me')
export class MeController {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(AuthRepository) private readonly repo: AuthRepository,
  ) {}

  @Get()
  @UseGuards(AuthGuard)
  async me(@Req() request: AuthenticatedRequest): Promise<AccountView> {
    const userId = request.auth?.userId;
    const user = userId ? await this.repo.findUserById(userId) : null;
    if (!user || user.status !== 'Active') {
      throw new NourishHttpException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.ACCOUNT_DISABLED,
        'This account is no longer active.',
      );
    }
    return this.auth.accountView(user);
  }
}
