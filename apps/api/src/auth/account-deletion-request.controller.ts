import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RequestWebDeletionDto } from './dto/auth.dto';

/** Public but throttled intake for the website's deletion-request form. */
@Controller('account-deletion-requests')
export class AccountDeletionRequestController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60 * 60 * 1000 } })
  @HttpCode(HttpStatus.ACCEPTED)
  request(
    @Body() body: RequestWebDeletionDto,
  ): Promise<{ requestId: string; receivedAt: string }> {
    return this.auth.requestWebDeletion(body);
  }
}
