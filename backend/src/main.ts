import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Validar variáveis de ambiente obrigatórias
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !configService.get<string>(envVar),
  );

  if (missingEnvVars.length > 0) {
    logger.error(
      `Aplicação não pode iniciar. Variáveis obrigatórias ausentes: ${missingEnvVars.join(', ')}`,
    );
    process.exit(1);
  }

  logger.log('Variáveis de ambiente validadas com sucesso');

  // Configurar CORS dinamicamente
  const corsOrigins = configService.get<string>('CORS_ORIGINS');
  const allowedOrigins = corsOrigins
    ? corsOrigins.split(',').map((origin) => origin.trim())
    : ['http://localhost:5173', 'http://127.0.0.1:5173'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Mercado Express API')
    .setDescription('API de delivery de supermercados estilo iFood')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
  logger.log(`Aplicação rodando na porta ${port}`);
}
bootstrap();