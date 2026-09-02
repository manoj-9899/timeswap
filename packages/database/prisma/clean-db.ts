import { PrismaClient, LedgerAccountType } from '@prisma/client';
import { seedLocations } from './seed-locations';

const prisma = new PrismaClient();

export const SYSTEM_RESERVE_ACCOUNT_ID = '00000000-0000-0000-0000-000000000000';
export const TREASURY_SINK_ACCOUNT_ID = '00000000-0000-0000-0000-000000000001';

async function main() {
  console.log('🧹 Purging test artifacts and demo data from database...');

  // Delete non-system records in correct foreign-key dependency order
  await prisma.notification.deleteMany({});
  await prisma.disputeCase.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.messageThread.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.escrowHold.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.serviceOffer.deleteMany({});
  await prisma.helpRequest.deleteMany({});
  await prisma.profileSkill.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.passwordResetToken.deleteMany({});
  await prisma.verificationToken.deleteMany({});
  await prisma.sessionToken.deleteMany({});
  await prisma.userCredential.deleteMany({});

  // Delete non-system ledger entries
  await prisma.journalEntry.deleteMany({});
  await prisma.ledgerTransaction.deleteMany({});
  await prisma.ledgerAccount.deleteMany({
    where: {
      id: {
        notIn: [SYSTEM_RESERVE_ACCOUNT_ID, TREASURY_SINK_ACCOUNT_ID],
      },
    },
  });

  // Delete non-system users
  await prisma.user.deleteMany({});

  // Purge test / dispute / mock skills & categories
  await prisma.skill.deleteMany({
    where: {
      OR: [
        { name: { contains: 'dispute', mode: 'insensitive' } },
        { name: { contains: 'test', mode: 'insensitive' } },
        { slug: { contains: 'dispute', mode: 'insensitive' } },
        { slug: { contains: 'test', mode: 'insensitive' } },
      ],
    },
  });

  await prisma.skillCategory.deleteMany({
    where: {
      OR: [
        { name: { contains: 'dispute', mode: 'insensitive' } },
        { name: { contains: 'test', mode: 'insensitive' } },
        { slug: { contains: 'dispute', mode: 'insensitive' } },
        { slug: { contains: 'test', mode: 'insensitive' } },
      ],
    },
  });

  console.log('⚡ Seeding core system ledger accounts...');
  await prisma.ledgerAccount.upsert({
    where: { id: SYSTEM_RESERVE_ACCOUNT_ID },
    update: { balance: 1000000.00 },
    create: {
      id: SYSTEM_RESERVE_ACCOUNT_ID,
      accountType: LedgerAccountType.SYSTEM_RESERVE,
      balance: 1000000.00,
    },
  });

  await prisma.ledgerAccount.upsert({
    where: { id: TREASURY_SINK_ACCOUNT_ID },
    update: { balance: 0.00 },
    create: {
      id: TREASURY_SINK_ACCOUNT_ID,
      accountType: LedgerAccountType.TREASURY_SINK,
      balance: 0.00,
    },
  });

  console.log('🌱 Seeding canonical skill taxonomy...');
  const canonicalCategories = [
    {
      name: 'Technology & Programming',
      slug: 'technology-programming',
      skills: ['Python Basics', 'React & Next.js', 'TypeScript Essentials', 'Git & GitHub Workflows'],
    },
    {
      name: 'Design & Creative',
      slug: 'design-creative',
      skills: ['Figma UI/UX Basics', 'Graphic Design Principles', 'Video Editing Fundamentals'],
    },
    {
      name: 'Languages & Academics',
      slug: 'languages-academics',
      skills: ['English Conversation Practice', 'Spanish Basics', 'Resume & Cover Letter Review'],
    },
    {
      name: 'Music & Hobbies',
      slug: 'music-hobbies',
      skills: ['Acoustic Guitar Basics', 'Digital Photography Basics', 'Fitness & Accountability'],
    },
  ];

  const canonicalCategorySlugs = canonicalCategories.map((c) => c.slug);

  for (const cat of canonicalCategories) {
    const category = await prisma.skillCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: {
        name: cat.name,
        slug: cat.slug,
      },
    });

    for (const skillName of cat.skills) {
      const skillSlug = skillName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      await prisma.skill.upsert({
        where: { slug: skillSlug },
        update: { name: skillName, categoryId: category.id },
        create: {
          categoryId: category.id,
          name: skillName,
          slug: skillSlug,
        },
      });
    }
  }

  // Delete any non-canonical categories remaining
  await prisma.skillCategory.deleteMany({
    where: {
      slug: {
        notIn: canonicalCategorySlugs,
      },
    },
  });

  console.log('📍 Seeding Maharashtra locations...');
  await seedLocations(prisma);

  console.log('✨ Clean database purge & seed finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Clean database error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
