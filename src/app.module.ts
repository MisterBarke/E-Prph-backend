import { FoldersModule } from './folders/folders.module';

import { UsersModule } from './users/users.module';

import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import * as dotenv from 'dotenv';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { HttpExceptionFilter } from './filters/all-exception.filter';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { SupabaseStrategy } from './auth/strategies/supabase.strategy';
import { MailModule } from './mail/mail.module';
import { RolesGuard } from './auth/guards/roles.guard';
// import { JwtAuthGuard } from './auth/guards/supabase.guard';
import { UploadModule } from './upload/upload.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

dotenv.config();

@Module({
  imports: [
    FoldersModule,
    UsersModule,
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    ThrottlerModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        return [
          {
            ttl: configService.get<number>('ratelimit.ttl', 10000),
            limit: configService.get<number>('ratelimit.limit', 50),
          },
        ];
      },
      inject: [ConfigService],
    }),
    PrismaModule,
    AuthModule,
    MailModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // SupabaseStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    AppService,
  ],
  // exports: [SupabaseStrategy],
})
export class AppModule {}
