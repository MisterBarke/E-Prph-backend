import { Module } from '@nestjs/common';
import { FoldersService } from './folders.service';
import { FoldersController } from './folders.controller';
import { PrismaModule } from '../prisma.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [PrismaModule],
  controllers: [FoldersController],
  providers: [FoldersService],
})
export class FoldersModule {}
