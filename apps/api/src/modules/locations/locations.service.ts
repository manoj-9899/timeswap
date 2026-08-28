import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@timeswap/database';
import {
  MAHARASHTRA_DISTRICTS,
  MAHARASHTRA_LOCATION_DATA,
  lookupPinCode,
} from '@timeswap/contracts';

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
      type: 'TOWN',
      pincode: null,
    }));
  }

  async resolvePincode(pincode: string) {
    try {
      const dbMapping = await prisma.pincodeMapping.findFirst({
        where: { pincode },
        include: {
          district: true,
          taluka: true,
        },
      });

      if (dbMapping) {
        const localities = await this.getLocalitiesByTaluka(
          dbMapping.talukaId,
        );
        return {
          pincode,
          district: {
            id: dbMapping.district.id,
            lgdCode: dbMapping.district.lgdCode,
            nameEn: dbMapping.district.nameEn,
            nameMr: dbMapping.district.nameMr,
            stateCode: dbMapping.district.stateCode,
          },
          taluka: {
            id: dbMapping.taluka.id,
            lgdCode: dbMapping.taluka.lgdCode,
            districtId: dbMapping.taluka.districtId,
            nameEn: dbMapping.taluka.nameEn,
            nameMr: dbMapping.taluka.nameMr,
          },
          localities,
        };
      }
    } catch {
      // Fall back
    }

    // Static fallback lookup
    const staticPin = lookupPinCode(pincode);
    if (staticPin) {
      const districtId = `dist_${staticPin.district}`;
      const talukaId = `tal_${staticPin.taluka}`;
      const placesList = (staticPin as any).places ||
        [(staticPin as any).place].filter(Boolean);

      return {
        pincode,
        district: {
          id: districtId,
          lgdCode: 490,
          nameEn: staticPin.district,
          nameMr: staticPin.district,
          stateCode: 'MH',
        },
        taluka: {
          id: talukaId,
          lgdCode: 4900,
          districtId,
          nameEn: staticPin.taluka,
          nameMr: staticPin.taluka,
        },
        localities: placesList.map((p: string, idx: number) => ({
          id: `loc_${idx + 1}`,
          talukaId,
          nameEn: p,
          nameMr: p,
          type: 'TOWN',
          pincode,
        })),
      };
    }

    throw new NotFoundException(
      `PIN code ${pincode} not found in Maharashtra location master dataset`,
    );
  }
}
