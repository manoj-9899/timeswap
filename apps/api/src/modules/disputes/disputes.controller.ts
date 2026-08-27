import { Controller, Post, Get, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { createDisputeSchema, resolveDisputeSchema, CreateDisputeDto, ResolveDisputeDto } from '@timeswap/contracts';
import { DisputesService } from './disputes.service.js';

@Controller('disputes')
@UseGuards(SessionAuthGuard)
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createDispute(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(createDisputeSchema)) dto: CreateDisputeDto,
  ) {
    const dispute = await this.disputesService.createDispute(userId, dto);
    return {
      success: true,
      data: dispute,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getDisputes(@CurrentUser('id') userId: string) {
    const disputes = await this.disputesService.getDisputes(userId);
    return {
      success: true,
      data: disputes,
    };
  }

  @Get('admin/all')
  @HttpCode(HttpStatus.OK)
  async getAllDisputesForAdmin() {
    const disputes = await this.disputesService.getAllDisputesForAdmin();
    return {
      success: true,
      data: disputes,
    };
  }

  @Post(':id/resolve')
  @HttpCode(HttpStatus.OK)
  async resolveDispute(
    @CurrentUser('id') moderatorId: string,
    @Param('id') disputeId: string,
    @Body(new ZodValidationPipe(resolveDisputeSchema)) dto: ResolveDisputeDto,
  ) {
    const result = await this.disputesService.resolveDispute(moderatorId, disputeId, dto);
    return {
      success: true,
      data: result,
    };
  }
}
