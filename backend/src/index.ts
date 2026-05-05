import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const fastify = Fastify({ logger: true });

fastify.register(cors, {
  origin: process.env.FRONTEND_URL || '*',
});

// List approved servers
fastify.get('/servers', async (request, reply) => {
  const servers = await prisma.server.findMany({
    where: {
      approved: true,
    },
    orderBy: [
      { isFeatured: 'desc' },
      { playersOnline: 'desc' },
    ],
  });
  return servers;
});

// Get single server
fastify.get('/servers/:id', async (request, reply) => {
  const { id } = request.params as { id: string };
  const server = await prisma.server.findUnique({
    where: { id },
  });
  if (!server) {
    return reply.status(404).send({ error: 'Server not found' });
  }
  return server;
});

// Submit a new server
fastify.post('/servers', async (request, reply) => {
  const data = request.body as any;
  try {
    const server = await prisma.server.create({
      data: {
        name: data.name,
        ip: data.ip,
        port: parseInt(data.port, 10),
        version: data.version,
        type: data.type,
        website: data.website || null,
        playersOnline: data.playersOnline ? parseInt(data.playersOnline, 10) : 0,
        maxPlayers: data.maxPlayers ? parseInt(data.maxPlayers, 10) : 0,
        ownerEmail: data.ownerEmail,
        approved: false,
        isFeatured: false,
      },
    });
    return reply.status(201).send(server);
  } catch (error) {
    fastify.log.error(error);
    return reply.status(400).send({ error: 'Invalid data' });
  }
});

// --- ADMIN ENDPOINTS ---

fastify.get('/admin/servers/pending', async (request, reply) => {
  const { secret } = request.headers as { secret?: string };
  if (secret !== process.env.ADMIN_SECRET) return reply.status(401).send({ error: 'Unauthorized' });
  
  const servers = await prisma.server.findMany({
    where: { approved: false },
    orderBy: { createdAt: 'desc' }
  });
  return servers;
});

fastify.get('/admin/servers/all', async (request, reply) => {
  const { secret } = request.headers as { secret?: string };
  if (secret !== process.env.ADMIN_SECRET) return reply.status(401).send({ error: 'Unauthorized' });
  
  const servers = await prisma.server.findMany({
    orderBy: { createdAt: 'desc' }
  });
  return servers;
});

fastify.patch('/servers/:id/approve', async (request, reply) => {
  const { id } = request.params as { id: string };
  const { secret } = request.headers as { secret?: string };

  if (secret !== process.env.ADMIN_SECRET) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  const server = await prisma.server.update({
    where: { id },
    data: { approved: true },
  });
  return server;
});

fastify.patch('/servers/:id/feature', async (request, reply) => {
  const { id } = request.params as { id: string };
  const { secret } = request.headers as { secret?: string };
  const data = request.body as { isFeatured: boolean };

  if (secret !== process.env.ADMIN_SECRET) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  const server = await prisma.server.update({
    where: { id },
    data: { isFeatured: data.isFeatured },
  });
  return server;
});

fastify.delete('/servers/:id', async (request, reply) => {
  const { id } = request.params as { id: string };
  const { secret } = request.headers as { secret?: string };

  if (secret !== process.env.ADMIN_SECRET) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  await prisma.server.delete({
    where: { id }
  });
  return { success: true };
});

const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT ? parseInt(process.env.PORT) : 3000, host: '0.0.0.0' });
    console.log(`Server is running on port ${process.env.PORT || 3000}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
