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
import { RequestsService } from './requests.service.js';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import {
  createHelpRequestSchema,
  updateHelpRequestSchema,
  submitProposalSchema,
  CreateHelpRequestDto,
  UpdateHelpRequestDto,
  SubmitProposalDto,
} from '@timeswap/contracts';
import { FastifyRequest } from 'fastify';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  @UseGuards(SessionAuthGuard)
  @UsePipes(new ZodValidationPipe(createHelpRequestSchema))
  @HttpCode(HttpStatus.CREATED)
  async createHelpRequest(
    @Req() req: FastifyRequest,
    @Body() dto: CreateHelpRequestDto,
  ) {
    const userId = (req as any).user.id;
    const data = await this.requestsService.createHelpRequest(userId, dto);
    return { success: true, data };
  }

  @Get(':id')
  async getRequestById(@Param('id') id: string) {
    const data = await this.requestsService.getRequestById(id);
    return { success: true, data };
  }

  @Patch(':id')
  @UseGuards(SessionAuthGuard)
  @UsePipes(new ZodValidationPipe(updateHelpRequestSchema))
  async updateHelpRequest(
    @Req() req: FastifyRequest,
    @Param('id') id: string,
    @Body() dto: UpdateHelpRequestDto,
  ) {
    const userId = (req as any).user.id;
    const data = await this.requestsService.updateHelpRequest(userId, id, dto);
    return { success: true, data };
  }

  @Post(':id/close')
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.OK)
  async closeHelpRequest(@Req() req: FastifyRequest, @Param('id') id: string) {
    const userId = (req as any).user.id;
    const data = await this.requestsService.closeHelpRequest(userId, id);
    return { success: true, data };
  }

  @Post(':id/proposals')
  @UseGuards(SessionAuthGuard)
  @UsePipes(new ZodValidationPipe(submitProposalSchema))
  @HttpCode(HttpStatus.OK)
  async submitProposal(
    @Req() req: FastifyRequest,
    @Param('id') id: string,
    @Body() dto: SubmitProposalDto,
  ) {
    const userId = (req as any).user.id;
    const data = await this.requestsService.submitProposal(userId, id, dto);
    return { success: true, data };
  }
}
