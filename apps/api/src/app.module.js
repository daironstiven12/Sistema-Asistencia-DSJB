import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AcademicModule } from './modules/academic/academic.module';
import { getThrottleConfig, getObserveConfig } from './config/app-config';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

function throttlerOptions() {
  const { ttl, limit } = getThrottleConfig();
  return {
    throttlers: [
      {
        ttl,
        limit,
      },
    ],
  };
}

function observeOptions() {
  const { appKey, appSecret, serviceId } = getObserveConfig();
  return { appKey, appSecret, serviceId };
}

@Module({
  imports: [
    ThrottlerModule.forRoot(throttlerOptions()),
    AuthModule,
    UsersModule,
    AcademicModule,
    ObserveModule.forRoot(observeOptions()),
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
