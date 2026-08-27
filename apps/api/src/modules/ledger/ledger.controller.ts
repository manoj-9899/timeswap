import { Controller, Get, Post, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { LedgerService } from './ledger.service.js';

@Controller('wallet')
@UseGuards(SessionAuthGuard)
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getWalletSummary(@CurrentUser('id') userId: string) {
    const summary = await this.ledgerService.getWalletSummary(userId);
    return {
      success: true,
      data: summary,
    };
  }

  @Get('balance')
  @HttpCode(HttpStatus.OK)
  async getWalletBalance(@CurrentUser('id') userId: string) {
    const summary = await this.ledgerService.getWalletSummary(userId);
    return {
      success: true,
      data: {
        available_balance: summary.available_balance,
        escrowed_balance: summary.escrowed_balance,
        total_balance: summary.total_balance,
        currency: 'TIME_CREDIT',
      },
    };
  }

  @Get('history')
  @HttpCode(HttpStatus.OK)
  async getWalletHistory(@CurrentUser('id') userId: string) {
    const summary = await this.ledgerService.getWalletSummary(userId);
    return {
      success: true,
      data: summary.history,
    };
  }

  @Post('grant-starter-credit')
  @HttpCode(HttpStatus.OK)
  async grantStarterCredit(@CurrentUser('id') userId: string) {
    const result = await this.ledgerService.grantStarterCredit(userId);
    return {
      success: true,
      data: result,
    };
  }
}
