import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { DiscoveryService } from './discovery.service.js';
import {
  discoveryOfferQuerySchema,
  discoveryRequestQuerySchema,
  discoveryMemberQuerySchema,
} from '@timeswap/contracts';

@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get('offers')
  @HttpCode(HttpStatus.OK)
  async searchOffers(@Query() queryParams: any) {
    const validatedQuery = discoveryOfferQuerySchema.parse(queryParams);
    const result = await this.discoveryService.searchOffers(validatedQuery);
    return {
      success: true,
      data: result,
    };
  }

  @Get('requests')
  @HttpCode(HttpStatus.OK)
  async searchRequests(@Query() queryParams: any) {
    const validatedQuery = discoveryRequestQuerySchema.parse(queryParams);
    const result = await this.discoveryService.searchRequests(validatedQuery);
    return {
      success: true,
      data: result,
    };
  }

  @Get('members')
  @HttpCode(HttpStatus.OK)
  async searchMembers(@Query() queryParams: any) {
    const validatedQuery = discoveryMemberQuerySchema.parse(queryParams);
    const result = await this.discoveryService.searchMembers(validatedQuery);
    return {
      success: true,
      data: result,
    };
  }
}
