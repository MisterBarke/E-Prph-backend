import { INestApplication } from '@nestjs/common';
import {
  SwaggerModule,
  DocumentBuilder,
  SwaggerCustomOptions,
} from '@nestjs/swagger';
import { promises } from 'fs';
import { join } from 'path';

export async function setupSwagger(app: INestApplication) {
  /**
   * Configuration for the Swagger-ui-express
   */
  const pkg = JSON.parse(
    await promises.readFile(join('./', 'package.json'), 'utf8'),
  );
  const config = new DocumentBuilder()
    .setTitle('E-Parapheur'.toUpperCase())
    .setDescription("La documentation pour l'api E-Parapheur")
    .setVersion(pkg.version)
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);

  const customOptions: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      displayOperationId: true,
      displayRequestDuration: true,
      operationsSorter: 'alpha',
      tagsSorter: 'alpha',
      tryItOutEnabled: true,
    },
    customSiteTitle: 'E-Parapheur API',
  };
  SwaggerModule.setup('api', app, document, customOptions);
}
