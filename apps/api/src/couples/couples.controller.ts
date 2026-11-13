import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { CouplesService, CoupleStateView } from './couples.service';
import { JoinCoupleDto, UpdateCoupleSharingDto } from './dto/couples.dto';

@Controller('couples')
@UseGuards(AuthGuard)
export class CouplesController {
  constructor(
    @Inject(CouplesService) private readonly couples: CouplesService,
  ) {}

  @Get()
  async state(@Req() request: AuthenticatedRequest): Promise<CoupleStateView> {
    return this.couples.state(this.userId(request));
  }

  @Post('invitations')
  @HttpCode(HttpStatus.CREATED)
  async invite(
    @Req() request: AuthenticatedRequest,
  ): Promise<{ code: string; expiresAt: string }> {
    return this.couples.createInvitation(this.userId(request));
  }

  @Post('join')
  @HttpCode(HttpStatus.OK)
  async join(
    @Req() request: AuthenticatedRequest,
    @Body() body: JoinCoupleDto,
  ): Promise<CoupleStateView> {
    return this.couples.join(this.userId(request), body.code);
  }

  @Patch('sharing')
  async sharing(
    @Req() request: AuthenticatedRequest,
    @Body() body: UpdateCoupleSharingDto,
  ): Promise<CoupleStateView> {
    return this.couples.updateSharing(this.userId(request), body);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async disconnect(@Req() request: AuthenticatedRequest): Promise<void> {
    await this.couples.disconnect(this.userId(request));
  }

  private userId(request: AuthenticatedRequest): string {
    const userId = request.auth?.userId;
    if (!userId) {
      throw new Error('AuthGuard did not attach a user id');
    }
    return userId;
  }
}
