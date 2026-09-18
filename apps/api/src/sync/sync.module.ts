import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SyncController } from './sync.controller';
import { SyncRepository } from './sync.repository';
import { SyncService } from './sync.service';

/**
 * The device↔server mirror (S3, ADR-0008). Depends on AuthModule for the guard
 * and on Prisma for storage; it holds no authority of its own — the device
 * remains the read model.
 */
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [SyncController],
  providers: [SyncRepository, SyncService],
  exports: [SyncService],
})
export class SyncModule {}
