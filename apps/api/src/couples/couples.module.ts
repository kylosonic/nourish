import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CouplesController } from './couples.controller';
import { CouplesRepository } from './couples.repository';
import { CouplesService } from './couples.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CouplesController],
  providers: [CouplesRepository, CouplesService],
})
export class CouplesModule {}
