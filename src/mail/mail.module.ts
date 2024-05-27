import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          transport: {
            host: configService.get('mail.host'),
            secure: configService.get('mail.isSecure'),
            auth: {
              user: configService.get('mail.user'),
              pass: configService.get('mail.password'),
            },
            port: 465,
          },
          defaults: {
            from: configService.get('mail.from'),
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
