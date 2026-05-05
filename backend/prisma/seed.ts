import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with sample servers...');

  // Clean up existing servers (optional but good for seed idempotency)
  await prisma.server.deleteMany();

  const servers = [
    {
      name: 'Sample Global OTS',
      ip: 'global.sampleots.com',
      port: 7171,
      version: '12.90',
      type: 'Global',
      website: 'https://global.sampleots.com',
      playersOnline: 450,
      maxPlayers: 1000,
      isFeatured: true,
      approved: true,
      ownerEmail: 'admin@sampleots.com',
    },
    {
      name: 'Baiak Extreme Dummy',
      ip: 'baiak.dummyots.net',
      port: 7171,
      version: '8.60',
      type: 'Custom',
      website: 'http://baiak.dummyots.net',
      playersOnline: 210,
      maxPlayers: 500,
      isFeatured: false,
      approved: true,
      ownerEmail: 'baiak@dummyots.net',
    },
    {
      name: 'OldSchool RPG 7.4 (Test)',
      ip: 'oldschool.test.org',
      port: 7171,
      version: '7.40',
      type: 'RPG',
      website: 'https://oldschool.test.org',
      playersOnline: 55,
      maxPlayers: 300,
      isFeatured: true,
      approved: true,
      ownerEmail: 'rpg@test.org',
    },
    {
      name: 'Pending PVP Server',
      ip: 'pvp.pending.com',
      port: 7171,
      version: '13.10',
      type: 'PVP-Enforced',
      playersOnline: 0,
      maxPlayers: 1000,
      isFeatured: false,
      approved: false, // Pendente!
      ownerEmail: 'pvp@pending.com',
    }
  ];

  for (const server of servers) {
    await prisma.server.create({ data: server });
  }

  console.log('Seeding finished successfully.');
  console.log('NOTE: Please remove these dummy servers before public launch!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
