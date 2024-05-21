import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SupabaseStrategy } from './strategies/supabase.strategy';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
import { MailModule } from '../mail/mail.module';
import { SupabaseModule } from '../supabase.module';

@Module({
  imports: [
    PassportModule,
    SupabaseModule,
    PrismaModule,
    ConfigModule,
    MailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, SupabaseStrategy],
  exports: [SupabaseStrategy],
})
export class AuthModule {}
