import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule, ObserveInstrument } from './app.module';
import { getCorsOrigins, getServerConfig } from './config/app-config';

function corsOrigins() {
  return getCorsOrigins();
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  app.use(helmet());
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.enableCors({ origin: corsOrigins(), credentials: true });
  const { port } = getServerConfig();
  await app.listen(port);
}
bootstrap();
