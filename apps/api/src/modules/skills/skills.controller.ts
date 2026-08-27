import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Param,
  Body,
  UseGuards,
  UsePipes,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SkillsService } from './skills.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  attachSkillSchema,
  removeSkillQuerySchema,
  listSkillsQuerySchema,
  AttachSkillDto,
  RemoveSkillQueryDto,
  ListSkillsQueryDto,
} from '@timeswap/contracts';

@Controller('skills')
@UseGuards(SessionAuthGuard)
export class SkillsController {
  constructor(private skillsService: SkillsService) {}

  @Public()
  @Get('categories')
  @HttpCode(HttpStatus.OK)
  async getCategories() {
    const categories = await this.skillsService.getCategories();
    return {
      success: true,
      data: categories,
    };
  }

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  async listSkills(@Query() query: ListSkillsQueryDto) {
    const skills = await this.skillsService.listSkills(query.category_id, query.q);
    return {
      success: true,
      data: skills,
    };
  }

  @Post('/me/skills')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(attachSkillSchema))
  async attachSkill(
    @CurrentUser('id') userId: string,
    @Body() dto: AttachSkillDto,
  ) {
    const result = await this.skillsService.attachSkillToProfile(
      userId,
      dto.skill_id,
      dto.role as any,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Delete('/me/skills/:skillId')
  @HttpCode(HttpStatus.OK)
  async removeSkill(
    @CurrentUser('id') userId: string,
    @Param('skillId') skillId: string,
    @Query('role') role: string,
  ) {
    const validRole = role === 'LEARNING' ? 'LEARNING' : 'OFFERED';
    const result = await this.skillsService.removeSkillFromProfile(
      userId,
      skillId,
      validRole as any,
    );
    return {
      success: true,
      data: result,
    };
  }
}
