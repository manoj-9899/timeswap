import { Module } from '@nestjs/common';
import { OffersService } from './offers.service.js';
import { RequestsService } from './requests.service.js';
import { OffersController } from './offers.controller.js';
import { RequestsController } from './requests.controller.js';
import { UserMarketplaceController } from './user-marketplace.controller.js';

@Module({
  controllers: [
    OffersController,
    RequestsController,
    UserMarketplaceController,
  ],
  providers: [OffersService, RequestsService],
  exports: [OffersService, RequestsService],
})
export class MarketplaceModule {}
