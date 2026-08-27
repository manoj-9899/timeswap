import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  UsePipes,
} from '@nestjs/common';
import { OffersService } from './offers.service.js';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import {
  createOfferSchema,
  updateOfferSchema,
  CreateOfferDto,
  UpdateOfferDto,
} from '@timeswap/contracts';
import { FastifyRequest } from 'fastify';

@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  @UseGuards(SessionAuthGuard)
  @UsePipes(new ZodValidationPipe(createOfferSchema))
  @HttpCode(HttpStatus.CREATED)
  async createOffer(@Req() req: FastifyRequest, @Body() dto: CreateOfferDto) {
    const userId = (req as any).user.id;
    const data = await this.offersService.createOffer(userId, dto);
    return { success: true, data };
  }

  @Get(':id')
  async getOfferById(@Param('id') id: string) {
    const data = await this.offersService.getOfferById(id);
    return { success: true, data };
  }

  @Patch(':id')
  @UseGuards(SessionAuthGuard)
  @UsePipes(new ZodValidationPipe(updateOfferSchema))
  async updateOffer(
    @Req() req: FastifyRequest,
    @Param('id') id: string,
    @Body() dto: UpdateOfferDto,
  ) {
    const userId = (req as any).user.id;
    const data = await this.offersService.updateOffer(userId, id, dto);
    return { success: true, data };
  }

  @Post(':id/pause')
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.OK)
  async pauseOffer(@Req() req: FastifyRequest, @Param('id') id: string) {
    const userId = (req as any).user.id;
    const data = await this.offersService.pauseOffer(userId, id);
    return { success: true, data };
  }

  @Post(':id/publish')
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.OK)
  async publishOffer(@Req() req: FastifyRequest, @Param('id') id: string) {
    const userId = (req as any).user.id;
    const data = await this.offersService.publishOffer(userId, id);
    return { success: true, data };
  }

  @Post(':id/archive')
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.OK)
  async archiveOffer(@Req() req: FastifyRequest, @Param('id') id: string) {
    const userId = (req as any).user.id;
    const data = await this.offersService.archiveOffer(userId, id);
    return { success: true, data };
  }
}
