import { Module } from '@nestjs/common';
import { FoldersService } from './folders.service';
import { FoldersController } from './folders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [FoldersController],
  providers: [FoldersService],
})
export class FoldersModule {}
