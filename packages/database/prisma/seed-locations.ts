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

  // 3. Query all valid District & Taluka IDs after creation
  const validTalukas = await prisma.taluka.findMany({ select: { id: true, lgdCode: true } });
  const validTalukaIds = new Set(validTalukas.map((t) => t.id));

  const validDistricts = await prisma.district.findMany({ select: { id: true, lgdCode: true } });
  const validDistrictIds = new Set(validDistricts.map((d) => d.id));

  // 4. Prepare Localities & PIN Code Mappings for Bulk Insert
  const localitiesToInsert: { talukaId: string; nameEn: string; type: LocalityType; pincode: string }[] = [];
  const pincodesToInsert: { pincode: string; districtId: string; talukaId: string; localityName: string }[] = [];

  const existingLocalities = await prisma.locality.findMany({ select: { talukaId: true, nameEn: true } });
  const localitySet = new Set(existingLocalities.map((l) => `${l.talukaId}::${l.nameEn}`));

  const existingPincodes = await prisma.pincodeMapping.findMany({ select: { pincode: true, talukaId: true, localityName: true } });
  const pincodeSet = new Set(existingPincodes.map((p) => `${p.pincode}::${p.talukaId}::${p.localityName}`));

  for (const p of pincodesData) {
    const districtId = districtIdMap.get(p.districtLgdCode);
    const talukaId = talukaIdMap.get(p.talukaLgdCode);

    if (!districtId || !talukaId || !validDistrictIds.has(districtId) || !validTalukaIds.has(talukaId)) {
      continue;
    }

    const localityKey = `${talukaId}::${p.localityName}`;
    if (!localitySet.has(localityKey)) {
      localitySet.add(localityKey);
      localitiesToInsert.push({
        talukaId,
        nameEn: p.localityName,
        type: LocalityType.TOWN,
        pincode: p.pincode,
      });
    }

    const pincodeKey = `${p.pincode}::${talukaId}::${p.localityName}`;
    if (!pincodeSet.has(pincodeKey)) {
      pincodeSet.add(pincodeKey);
      pincodesToInsert.push({
        pincode: p.pincode,
        districtId,
        talukaId,
        localityName: p.localityName,
      });
    }
  }

  if (localitiesToInsert.length > 0) {
    try {
      await prisma.locality.createMany({
        data: localitiesToInsert,
        skipDuplicates: true,
      });
    } catch {
      for (const item of localitiesToInsert) {
        try {
          await prisma.locality.create({ data: item });
        } catch {
          // ignore duplicate / invalid FK items gracefully
        }
      }
    }
  }

  if (pincodesToInsert.length > 0) {
    try {
      await prisma.pincodeMapping.createMany({
        data: pincodesToInsert,
        skipDuplicates: true,
      });
    } catch {
      for (const item of pincodesToInsert) {
        try {
          await prisma.pincodeMapping.create({ data: item });
        } catch {
          // ignore duplicate / invalid FK items gracefully
        }
      }
    }
  }

  console.log(`Seeded localities and pincode mappings successfully.`);
}
