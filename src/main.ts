import helmet from 'helmet';
import { ValidationError } from 'class-validator';
import { ValidationFilter } from './filters/validation.filter';
import { validationError } from './filters/validation.errors';
import { ValidationPipe } from '@nestjs/common';
import { setupSwagger } from './swagger';
import * as dotenv from 'dotenv';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.enableCors();
  app.setGlobalPrefix('api/v1');
  setupSwagger(app);
  const configService = app.get(ConfigService);
  app.useGlobalFilters(new ValidationFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      always: true,
      exceptionFactory: (errors: ValidationError[]) => {
        return validationError(errors);
      },
    }),
  );

  await app.listen(configService.get<number>('port', 5000));
}
bootstrap();
