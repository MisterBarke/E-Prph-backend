import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SupabaseStrategy } from './strategies/supabase.strategy';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PassportModule, PrismaModule, ConfigModule],
  controllers: [AuthController],
  providers: [AuthService, SupabaseStrategy],
})
export class AuthModule {}
