import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { OffersService } from './offers.service.js';
import { RequestsService } from './requests.service.js';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard.js';
import { FastifyRequest } from 'fastify';

@Controller('users/me')
@UseGuards(SessionAuthGuard)
export class UserMarketplaceController {
  constructor(
    private readonly offersService: OffersService,
    private readonly requestsService: RequestsService,
  ) {}

  @Get('offers')
  async getMyOffers(@Req() req: FastifyRequest) {
    const userId = (req as any).user.id;
    const data = await this.offersService.getUserOffers(userId);
    return { success: true, data };
  }

  @Get('requests')
  async getMyRequests(@Req() req: FastifyRequest) {
    const userId = (req as any).user.id;
    const data = await this.requestsService.getUserRequests(userId);
    return { success: true, data };
  }
}
