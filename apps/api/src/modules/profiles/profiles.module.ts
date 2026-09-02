import { Module } from '@nestjs/common';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [NotificationsModule, LedgerModule],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
