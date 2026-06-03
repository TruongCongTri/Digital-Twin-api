/**
 * @file server.ts
 * @description Application bootstrap and server entry point.
 * Ensures infrastructure (Database) is ready before accepting incoming HTTP traffic.
 * @module Server
 */
import http from 'http';
import { prisma } from '@/common/configs/prisma';
import { env } from '@/common/configs/env.config';
import app from '@/app';
import { initializeSocket } from '@/common/configs/socket.config';

/**
 * @function checkDatabaseConnection
 * @description Verifies that the Prisma client can establish a secure connection to the database.
 * Exits the process with code 1 if the connection fails.
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
 * @function startServer
 * @description Orchestrates the startup sequence: DB check -> HTTP listener.
 */
const startServer = async () => {
  try {
    await checkDatabaseConnection();

    const port = parseInt(env.PORT, 10);

    const server = http.createServer(app);

    initializeSocket(server);

    server.listen(port, () => {
      console.log(`=================================`);
      console.log(`API Server is running at: http://localhost:${port}`);
      console.log(`Accepting connections from: ${env.CLIENT_URL}`);
      console.log(`=================================`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();
