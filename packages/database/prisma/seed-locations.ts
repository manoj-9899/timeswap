import { PrismaClient, LocalityType } from '@prisma/client';
import districtsData from './seeds/locations/districts.json';
import talukasData from './seeds/locations/talukas.json';
import pincodesData from './seeds/locations/pincodes.json';

export async function seedLocations(prisma: PrismaClient) {
  console.log('Seeding Maharashtra Location System Master Data...');

  // 1. Seed Districts
  const districtIdMap = new Map<number, string>();
  for (const d of districtsData) {
    const existing = await prisma.district.findUnique({
      where: { lgdCode: d.lgdCode },
    });

    if (existing) {
      districtIdMap.set(d.lgdCode, existing.id);
    } else {
      const created = await prisma.district.create({
        data: {
          lgdCode: d.lgdCode,
          nameEn: d.nameEn,
          nameMr: d.nameMr,
          stateCode: 'MH',
        },
      });
      districtIdMap.set(d.lgdCode, created.id);
    }
  }
  console.log(`Seeded ${districtIdMap.size} districts.`);

  // 2. Seed Talukas
  const talukaIdMap = new Map<number, string>();
  for (const t of talukasData) {
    const districtId = districtIdMap.get(t.districtLgdCode);
    if (!districtId) continue;

    const existing = await prisma.taluka.findUnique({
      where: { lgdCode: t.lgdCode },
    });

    if (existing) {
      talukaIdMap.set(t.lgdCode, existing.id);
    } else {
      const created = await prisma.taluka.create({
        data: {
          lgdCode: t.lgdCode,
          districtId,
          nameEn: t.nameEn,
          nameMr: t.nameMr,
        },
      });
      talukaIdMap.set(t.lgdCode, created.id);
    }
  }
  console.log(`Seeded ${talukaIdMap.size} talukas.`);

  // 3. Seed PIN Code Mappings and Localities
  let pincodeCount = 0;
  for (const p of pincodesData) {
    const districtId = districtIdMap.get(p.districtLgdCode);
    const talukaId = talukaIdMap.get(p.talukaLgdCode);
    if (!districtId || !talukaId) continue;

    // Check locality
    const existingLocality = await prisma.locality.findFirst({
      where: { talukaId, nameEn: p.localityName },
    });

    if (!existingLocality) {
      await prisma.locality.create({
        data: {
          talukaId,
          nameEn: p.localityName,
          type: LocalityType.TOWN,
          pincode: p.pincode,
        },
      });
    }

    const existingPin = await prisma.pincodeMapping.findFirst({
      where: { pincode: p.pincode, talukaId, localityName: p.localityName },
    });

    if (!existingPin) {
      await prisma.pincodeMapping.create({
        data: {
          pincode: p.pincode,
          districtId,
          talukaId,
          localityName: p.localityName,
        },
      });
      pincodeCount++;
    }
  }

  console.log(`Seeded PIN code mappings & default localities.`);
}
