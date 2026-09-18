import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { SyncChangesQueryDto, SyncPushDto } from './dto/sync.dto';
import { SyncPullResult, SyncPushResult, SyncService } from './sync.service';

/**
 * The device↔server sync surface (OFF-02, ADR-0008).
 *
 * Both routes require a session: the mirror belongs to an account. A device with
 * no account keeps working entirely locally (OFF-01) and simply does not sync.
 */
@Controller('sync')
@UseGuards(AuthGuard)
export class SyncController {
  constructor(@Inject(SyncService) private readonly sync: SyncService) {}

  /** Apply the device's queued operations, in the order it recorded them. */
  @Post()
  @HttpCode(HttpStatus.OK)
  async push(
    @Req() request: AuthenticatedRequest,
    @Body() body: SyncPushDto,
  ): Promise<SyncPushResult> {
    return this.sync.push(request.auth!.userId, body.operations);
  }

  /** Everything changed after the device's cursor, tombstones included. */
  @Get('changes')
  async changes(
    @Req() request: AuthenticatedRequest,
    @Query() query: SyncChangesQueryDto,
  ): Promise<SyncPullResult> {
    return this.sync.pull(request.auth!.userId, query.since, query.limit ?? 500);
  }
}
