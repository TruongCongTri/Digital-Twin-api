/**
 * @file server.ts
 * @description Application bootstrap and server entry point.
 * Ensures infrastructure (Database) is ready before accepting incoming HTTP traffic.
 * @module Server
 */
import { prisma } from '@/common/configs/prisma';
import { env } from '@/common/configs/env.config';
import app from '@/app';

import http from 'http';
import { initializeSocket } from '@/common/configs/socket.config';
import { redisConnection } from '@/common/configs/redis.config';

/**
 * @function checkDatabaseConnection
 * @description Verifies that the Prisma client can establish a secure connection to the database.
 */
const checkDatabaseConnection = async () => {
  try {
    await prisma.$connect();
    console.log('[Database]: Connected successfully!');
  } catch (error) {
    console.error('[Database]: Failed to connect. Error:', error);
    process.exit(1);
  }
};

/**
 * @function checkRedisConnection
 * @description Verifies connection to Upstash/Redis before starting the server.
 */
const checkRedisConnection = async () => {
  try {
    await redisConnection.ping();
    console.log('[Redis]: Connected successfully!');
  } catch (error) {
    console.error('[Redis]: Failed to connect to Redis. Error:', error);
    process.exit(1);
  }
};

// --- GLOBAL CRASH HANDLERS ---
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

/**
 * @function startServer
 * @description Orchestrates the startup sequence: DB check -> Redis Check -> HTTP listener.
 */
const startServer = async () => {
  try {
    console.log('[System]: server.ts has started!');
    console.log('[System]: Starting initialization...');

    // 1. Check Infrastructure
    await checkDatabaseConnection();
    await checkRedisConnection(); // <-- NEW: Check Redis

    // 2. Start Server
    const port = parseInt(env.PORT, 10);
    const server = http.createServer(app);

    initializeSocket(server);

    server.listen(port, '0.0.0.0', () => {
      console.log(`=================================`);
      console.log(`API Server is running on 0.0.0.0:${port}`);
      console.log(`=================================`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();
