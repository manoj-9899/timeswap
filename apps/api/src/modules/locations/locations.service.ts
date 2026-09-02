import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { prisma } from '@timeswap/database';
import {
  MAHARASHTRA_DISTRICTS,
  MAHARASHTRA_LOCATION_DATA,
} from '@timeswap/contracts';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { isValidPincode, findByPincode } = require('@twin.techies/india-pincode');

const DISTRICT_ALIAS_MAP: Record<string, string> = {
  aurangabad: 'Chhatrapati Sambhajinagar',
  osmanabad: 'Dharashiv',
  ahmednagar: 'Ahilyanagar',
};

@Injectable()
export class LocationsService {
  async getDistricts() {
    try {
      const dbDistricts = await prisma.district.findMany({
        orderBy: { nameEn: 'asc' },
      });

      if (dbDistricts.length > 0) {
        return dbDistricts.map((d: any) => ({
          id: d.id,
          lgdCode: d.lgdCode,
          nameEn: d.nameEn,
          nameMr: d.nameMr,
          name_en: d.nameEn,
          name_mr: d.nameMr,
          stateCode: d.stateCode,
        }));
      }
    } catch {
      // Fall back if DB table not queryable in dev
    }

    return (MAHARASHTRA_DISTRICTS as any[]).map((item: any, index: number) => {
      const name = typeof item === 'string' ? item : item.district || item.city;
      return {
        id: `dist_${index + 1}`,
        lgdCode: 490 + index,
        nameEn: name,
        nameMr: name,
        name_en: name,
        name_mr: name,
        stateCode: 'MH',
      };
    });
  }

  async getTalukasByDistrict(districtId: string) {
    try {
      const dbTalukas = await prisma.taluka.findMany({
        where: { districtId },
        orderBy: { nameEn: 'asc' },
      });

      if (dbTalukas.length > 0) {
        return dbTalukas.map((t: any) => ({
          id: t.id,
          lgdCode: t.lgdCode,
          districtId: t.districtId,
          nameEn: t.nameEn,
          nameMr: t.nameMr,
          name_en: t.nameEn,
          name_mr: t.nameMr,
        }));
      }
    } catch {
      // Fall back
    }

    let districtName = districtId;
    try {
      const district = await prisma.district.findUnique({
        where: { id: districtId },
      });
      if (district) districtName = district.nameEn;
    } catch {
      // Ignore
    }

    const distObj = (MAHARASHTRA_LOCATION_DATA as any[]).find(
      (d: any) => d.district.toLowerCase() === districtName.toLowerCase(),
    );

    if (!distObj) {
      return [];
    }

    return distObj.talukas.map((t: any, index: number) => ({
      id: `tal_${districtId}_${index + 1}`,
      lgdCode: 4900 + index,
      districtId,
      nameEn: t.name,
      nameMr: t.name,
      name_en: t.name,
      name_mr: t.name,
    }));
  }

  async getLocalitiesByTaluka(talukaId: string, search?: string) {
    try {
      const dbLocalities = await prisma.locality.findMany({
        where: {
          talukaId,
          ...(search
            ? { nameEn: { contains: search, mode: 'insensitive' } }
            : {}),
        },
        orderBy: { nameEn: 'asc' },
        take: 50,
      });

      if (dbLocalities.length > 0) {
        return dbLocalities.map((l: any) => ({
          id: l.id,
          talukaId: l.talukaId,
          nameEn: l.nameEn,
          nameMr: l.nameMr,
          name_en: l.nameEn,
          name_mr: l.nameMr,
          type: l.type,
          pincode: l.pincode,
        }));
      }
    } catch {
      // Fall back
    }

    let talukaName = talukaId;
    try {
      const taluka = await prisma.taluka.findUnique({
        where: { id: talukaId },
      });
      if (taluka) talukaName = taluka.nameEn;
    } catch {
      // Ignore
    }

    let places: string[] = [];
    for (const distObj of MAHARASHTRA_LOCATION_DATA as any[]) {
      const matchTaluka = distObj.talukas.find(
        (t: any) => t.name.toLowerCase() === talukaName.toLowerCase(),
      );
      if (matchTaluka) {
        places = matchTaluka.places;
        break;
      }
    }

    const filtered = search
      ? places.filter((p: string) =>
          p.toLowerCase().includes(search.toLowerCase()),
        )
      : places;

    return filtered.map((p: string, index: number) => ({
      id: `loc_${talukaId}_${index + 1}`,
      talukaId,
      nameEn: p,
      nameMr: p,
      name_en: p,
      name_mr: p,
      type: 'TOWN',
      pincode: null,
    }));
  }

  async resolvePincode(pincode: string) {
    // 1. Format Validation
    if (!pincode || !isValidPincode(pincode)) {
      throw new BadRequestException({
        code: 'INVALID_PINCODE_FORMAT',
        message: 'PIN code must be a valid 6-digit number.',
      });
    }

    // 2. Offline Lookup
    const pincodeData = findByPincode(pincode);
    if (!pincodeData) {
      throw new NotFoundException({
        code: 'PINCODE_NOT_FOUND',
        message: 'PIN code not recognized.',
      });
    }

    // 3. State Guard
    if (
      !pincodeData.state ||
      pincodeData.state.toLowerCase() !== 'maharashtra'
    ) {
      throw new BadRequestException({
        code: 'PINCODE_OUTSIDE_MAHARASHTRA',
        message: 'TimeSwap is currently available only in Maharashtra.',
      });
    }

    // 4. Relational Database Matching with Alias Normalization
    const rawDistrict = pincodeData.district || '';
    const normalizedDistrict =
      DISTRICT_ALIAS_MAP[rawDistrict.toLowerCase()] || rawDistrict;

    let dbDistrict: any = null;
    try {
      dbDistrict = await prisma.district.findFirst({
        where: {
          OR: [
            { nameEn: { equals: normalizedDistrict, mode: 'insensitive' } },
            { nameEn: { contains: normalizedDistrict, mode: 'insensitive' } },
            { nameEn: { equals: rawDistrict, mode: 'insensitive' } },
          ],
        },
        include: {
          talukas: {
            orderBy: { nameEn: 'asc' },
          },
        },
      });
    } catch {
      // Ignore DB errors during fallback/test mode
    }

    let district: any;
    let talukas: any[] = [];

    if (dbDistrict) {
      district = {
        id: dbDistrict.id,
        lgdCode: dbDistrict.lgdCode,
        nameEn: dbDistrict.nameEn,
        nameMr: dbDistrict.nameMr,
        name_en: dbDistrict.nameEn,
        name_mr: dbDistrict.nameMr,
        stateCode: dbDistrict.stateCode,
      };

      talukas = dbDistrict.talukas.map((t: any) => ({
        id: t.id,
        lgdCode: t.lgdCode,
        districtId: t.districtId,
        nameEn: t.nameEn,
        nameMr: t.nameMr,
        name_en: t.nameEn,
        name_mr: t.nameMr,
      }));
    } else {
      district = {
        id: `dist_${normalizedDistrict.toLowerCase().replace(/\s+/g, '_')}`,
        nameEn: normalizedDistrict,
        nameMr: normalizedDistrict,
        name_en: normalizedDistrict,
        name_mr: normalizedDistrict,
        stateCode: 'MH',
      };

      // Fallback talukas lookup from static dataset if available
      const staticDistObj = (MAHARASHTRA_LOCATION_DATA as any[]).find(
        (d: any) =>
          d.district.toLowerCase() === normalizedDistrict.toLowerCase() ||
          d.district.toLowerCase() === rawDistrict.toLowerCase(),
      );

      if (staticDistObj) {
        talukas = staticDistObj.talukas.map((t: any, idx: number) => ({
          id: `tal_${idx + 1}`,
          districtId: district.id,
          nameEn: t.name,
          nameMr: t.name,
          name_en: t.name,
          name_mr: t.name,
        }));
      }
    }

    // 5. Extract unique post office localities
    const localities = (pincodeData.offices || []).map((office: any) => ({
      name_en: office.name,
      nameEn: office.name,
      city: office.city || rawDistrict,
      pincode: office.pincode || pincode,
    }));

    return {
      pincode,
      district,
      talukas,
      localities,
    };
  }
}
