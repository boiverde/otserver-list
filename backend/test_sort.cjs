const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();
prisma.server.findMany({
  where: { approved: true },
  orderBy: [
    { isFeatured: 'desc' },
    { isOnline: 'desc' },
    { playersOnline: 'desc' },
    { updatedAt: 'desc' }
  ]
}).then(servers => {
  console.log(servers.map(s => `${s.name} - Featured: ${s.isFeatured} - Online: ${s.isOnline} - Players: ${s.playersOnline}/${s.maxPlayers}`).join('\n'));
}).catch(console.error).finally(() => prisma.$disconnect());
