import { Redis } from 'ioredis';
import { env } from './env';

// BullMQ requires maxRetriesPerRequest to be null
export const redisConnection = new Redis({
  host: env.REDIS_HOST || '127.0.0.1',
  port: Number(env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
});

redisConnection.on('error', (err) => {
  console.error('❌ Redis Connection Error:', err);
});

redisConnection.once('ready', () => {
  console.log('✅ Redis Connected successfully.');
});
