import { Module, Global } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { EmailQueueService } from './email-queue.service';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Global()
@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    SessionService,
    EmailQueueService,
    SessionAuthGuard,
    RolesGuard,
  ],
  exports: [AuthService, PasswordService, SessionService, SessionAuthGuard, RolesGuard],
})
export class AuthModule {}
