import { Module } from '@nestjs/common';
import { FoldersService } from './folders.service';
import { FoldersController } from './folders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from 'src/mail/mail.module';
import { ClientsFoldersService } from './clientsFolders.service';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [FoldersController],
  providers: [FoldersService, ClientsFoldersService],
})
export class FoldersModule {}
