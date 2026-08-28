import {
  Controller,
  Get,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { LocationsService } from './locations.service';
import { pincodeParamSchema } from '@timeswap/contracts';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('districts')
  async getDistricts() {
    const districts = await this.locationsService.getDistricts();
    return {
      success: true,
      data: districts,
    };
  }

  @Get('districts/:districtId/talukas')
  async getTalukas(@Param('districtId') districtId: string) {
    const talukas = await this.locationsService.getTalukasByDistrict(districtId);
    return {
      success: true,
      data: talukas,
    };
  }

  @Get('talukas/:talukaId/localities')
  async getLocalities(
    @Param('talukaId') talukaId: string,
    @Query('search') search?: string,
  ) {
    const localities = await this.locationsService.getLocalitiesByTaluka(
      talukaId,
      search,
    );
    return {
      success: true,
      data: localities,
    };
  }

  @Get('resolve-pincode/:pincode')
  async resolvePincode(@Param('pincode') pincode: string) {
    const parsed = pincodeParamSchema.safeParse({ pincode });
    if (!parsed.success) {
      throw new BadRequestException('PIN code must be exactly 6 numeric digits');
    }

    const resolved = await this.locationsService.resolvePincode(parsed.data.pincode);
    return {
      success: true,
      data: resolved,
    };
  }
}
