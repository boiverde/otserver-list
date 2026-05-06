import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import { checkServerStatus } from './statusChecker.js';
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
            { isOnline: 'desc' },
            { playersOnline: 'desc' },
            { updatedAt: 'desc' },
        ],
    });
    return servers;
});
// Get single server
fastify.get('/servers/:id', async (request, reply) => {
    const { id } = request.params;
    const server = await prisma.server.findUnique({
        where: { id },
    });
    if (!server) {
        return reply.status(404).send({ error: 'Server not found' });
    }
    return server;
});
// Public submit — disabled (use admin panel)
fastify.post('/servers', async (_request, reply) => {
    return reply.status(403).send({ error: 'Cadastro público desativado. Entre em contato com o administrador.' });
});
// --- ADMIN ENDPOINTS ---
// Admin: create server directly (approved by default)
fastify.post('/admin/servers', async (request, reply) => {
    const { secret } = request.headers;
    if (secret !== process.env.ADMIN_SECRET)
        return reply.status(401).send({ error: 'Unauthorized' });
    const data = request.body;
    try {
        const server = await prisma.server.create({
            data: {
                name: String(data.name),
                ip: String(data.ip),
                port: Number(data.port) || 7171,
                version: String(data.version),
                type: String(data.type || 'Custom'),
                website: data.website ? String(data.website) : null,
                ownerEmail: String(data.ownerEmail || 'admin@admin.com'),
                playersOnline: 0,
                maxPlayers: 0,
                approved: data.approved !== undefined ? Boolean(data.approved) : true,
                isFeatured: Boolean(data.isFeatured) || false,
            },
        });
        return reply.status(201).send(server);
    }
    catch (error) {
        console.error('Admin create server error:', error);
        return reply.status(400).send({ error: 'Dados inválidos' });
    }
});
fastify.get('/admin/servers/pending', async (request, reply) => {
    const { secret } = request.headers;
    if (secret !== process.env.ADMIN_SECRET)
        return reply.status(401).send({ error: 'Unauthorized' });
    const servers = await prisma.server.findMany({
        where: { approved: false },
        orderBy: { createdAt: 'desc' }
    });
    return servers;
});
fastify.get('/admin/servers/all', async (request, reply) => {
    const { secret } = request.headers;
    if (secret !== process.env.ADMIN_SECRET)
        return reply.status(401).send({ error: 'Unauthorized' });
    const servers = await prisma.server.findMany({
        orderBy: { createdAt: 'desc' }
    });
    return servers;
});
fastify.patch('/servers/:id/approve', async (request, reply) => {
    const { id } = request.params;
    const { secret } = request.headers;
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
    const { id } = request.params;
    const { secret } = request.headers;
    const data = request.body;
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
    const { id } = request.params;
    const { secret } = request.headers;
    if (secret !== process.env.ADMIN_SECRET) {
        return reply.status(401).send({ error: 'Unauthorized' });
    }
    await prisma.server.delete({
        where: { id }
    });
    return { success: true };
});
fastify.patch('/admin/servers/:id', async (request, reply) => {
    const { id } = request.params;
    const { secret } = request.headers;
    if (secret !== process.env.ADMIN_SECRET) {
        return reply.status(401).send({ error: 'Unauthorized' });
    }
    const data = request.body;
    const updateData = {};
    if (data.name !== undefined)
        updateData.name = data.name;
    if (data.ip !== undefined)
        updateData.ip = data.ip;
    if (data.port !== undefined)
        updateData.port = Number(data.port);
    if (data.version !== undefined)
        updateData.version = data.version;
    if (data.type !== undefined)
        updateData.type = data.type;
    if (data.website !== undefined)
        updateData.website = data.website;
    if (data.ownerEmail !== undefined)
        updateData.ownerEmail = data.ownerEmail;
    if (data.playersOnline !== undefined)
        updateData.playersOnline = Number(data.playersOnline);
    if (data.maxPlayers !== undefined)
        updateData.maxPlayers = Number(data.maxPlayers);
    if (data.isFeatured !== undefined)
        updateData.isFeatured = Boolean(data.isFeatured);
    if (data.approved !== undefined)
        updateData.approved = Boolean(data.approved);
    try {
        const server = await prisma.server.update({
            where: { id },
            data: updateData,
        });
        return server;
    }
    catch (error) {
        console.error('Update server error:', error);
        return reply.status(500).send({ error: 'Erro ao salvar no banco de dados' });
    }
});
fastify.post('/admin/servers/test-status', async (request, reply) => {
    const { secret } = request.headers;
    if (secret !== process.env.ADMIN_SECRET)
        return reply.status(401).send({ error: 'Unauthorized' });
    const { ip, port } = request.body;
    if (!ip || !port)
        return reply.status(400).send({ error: 'IP and port required' });
    const status = await checkServerStatus(ip, Number(port));
    return status;
});
// removed
fastify.post('/admin/servers/:id/check', async (request, reply) => {
    const { secret } = request.headers;
    if (secret !== process.env.ADMIN_SECRET)
        return reply.status(401).send({ error: 'Unauthorized' });
    const { id } = request.params;
    const server = await prisma.server.findUnique({ where: { id } });
    if (!server)
        return reply.status(404).send({ error: 'Server not found' });
    const status = await checkServerStatus(server.ip, server.port);
    const updated = await prisma.server.update({
        where: { id },
        data: {
            isOnline: status.isOnline,
            playersOnline: status.playersOnline,
            maxPlayers: status.maxPlayers,
            statusError: status.error || null,
            lastCheckedAt: new Date()
        }
    });
    return updated;
});
fastify.post('/admin/servers/check-all', async (request, reply) => {
    const { secret } = request.headers;
    if (secret !== process.env.ADMIN_SECRET)
        return reply.status(401).send({ error: 'Unauthorized' });
    const servers = await prisma.server.findMany({ where: { approved: true } });
    let onlineCount = 0;
    let offlineCount = 0;
    let failedCount = 0;
    // Process in batches of 3
    for (let i = 0; i < servers.length; i += 3) {
        const batch = servers.slice(i, i + 3);
        await Promise.all(batch.map(async (server) => {
            try {
                const status = await checkServerStatus(server.ip, server.port);
                await prisma.server.update({
                    where: { id: server.id },
                    data: {
                        isOnline: status.isOnline,
                        playersOnline: status.playersOnline,
                        maxPlayers: status.maxPlayers,
                        statusError: status.error || null,
                        lastCheckedAt: new Date()
                    }
                });
                if (status.isOnline)
                    onlineCount++;
                else
                    offlineCount++;
            }
            catch (err) {
                failedCount++;
            }
        }));
    }
    return { total: servers.length, online: onlineCount, offline: offlineCount, failed: failedCount };
});
const start = async () => {
    try {
        await fastify.listen({ port: process.env.PORT ? parseInt(process.env.PORT) : 3000, host: '0.0.0.0' });
        console.log(`Server is running on port ${process.env.PORT || 3000}`);
        console.log("ADMIN ROUTES LOADED");
        // Auto status check every 5 minutes
        setInterval(async () => {
            try {
                console.log('Running auto status check...');
                const servers = await prisma.server.findMany({ where: { approved: true } });
                let onlineCount = 0;
                let offlineCount = 0;
                for (let i = 0; i < servers.length; i += 3) {
                    const batch = servers.slice(i, i + 3);
                    await Promise.all(batch.map(async (server) => {
                        const status = await checkServerStatus(server.ip, server.port);
                        await prisma.server.update({
                            where: { id: server.id },
                            data: {
                                isOnline: status.isOnline,
                                playersOnline: status.playersOnline,
                                maxPlayers: status.maxPlayers,
                                statusError: status.error || null,
                                lastCheckedAt: new Date()
                            }
                        });
                        if (status.isOnline)
                            onlineCount++;
                        else
                            offlineCount++;
                    }));
                }
                console.log(`Auto check finished: ${servers.length} total, ${onlineCount} online, ${offlineCount} offline.`);
            }
            catch (err) {
                console.error('Auto status check failed', err);
            }
        }, 5 * 60 * 1000); // 5 minutes
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
