import { PrismaClient, LedgerAccountType } from '@prisma/client';

const prisma = new PrismaClient();

export const SYSTEM_RESERVE_ACCOUNT_ID = '00000000-0000-0000-0000-000000000000';
export const TREASURY_SINK_ACCOUNT_ID = '00000000-0000-0000-0000-000000000001';

async function main() {
  console.log('Seeding system ledger accounts...');

  await prisma.ledgerAccount.upsert({
    where: { id: SYSTEM_RESERVE_ACCOUNT_ID },
    update: {},
    create: {
      id: SYSTEM_RESERVE_ACCOUNT_ID,
      accountType: LedgerAccountType.SYSTEM_RESERVE,
      balance: 1000000.00,
    },
  });

  await prisma.ledgerAccount.upsert({
    where: { id: TREASURY_SINK_ACCOUNT_ID },
    update: {},
    create: {
      id: TREASURY_SINK_ACCOUNT_ID,
      accountType: LedgerAccountType.TREASURY_SINK,
      balance: 0.00,
    },
  });

  console.log('Seeding skill taxonomy...');

  const categories = [
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

  for (const cat of categories) {
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
        update: { name: skillName },
        create: {
          categoryId: category.id,
          name: skillName,
          slug: skillSlug,
        },
      });
    }
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
