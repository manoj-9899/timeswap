import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { HealthModule } from './modules/health/health.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { ProfilesModule } from './modules/profiles/profiles.module.js';
import { SkillsModule } from './modules/skills/skills.module.js';
import { MarketplaceModule } from './modules/marketplace/marketplace.module.js';
import { DiscoveryModule } from './modules/discovery/discovery.module.js';
import { BookingsModule } from './modules/bookings/bookings.module.js';
import { LedgerModule } from './modules/ledger/ledger.module.js';
import { DisputesModule } from './modules/disputes/disputes.module.js';
import { ReviewsModule } from './modules/reviews/reviews.module.js';
import { MessagingModule } from './modules/messaging/messaging.module.js';
import { LocationsModule } from './modules/locations/locations.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter.js';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), '../../.env'),
        path.resolve(__dirname, '../../../.env'),
        path.resolve(__dirname, '../../../../.env'),
      ],
    }),
    HealthModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    SkillsModule,
    MarketplaceModule,
    DiscoveryModule,
    BookingsModule,
    LedgerModule,
    DisputesModule,
    ReviewsModule,
    MessagingModule,
    LocationsModule,
    NotificationsModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: PrismaExceptionFilter,
    },
  ],
})
export class AppModule {}
