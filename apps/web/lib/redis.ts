import Redis from 'ioredis';

let redisClient: Redis | null = null;

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 2,
      retryStrategy: (times) => {
        if (times > 3) return null; // stop retrying after 3 attempts
        return Math.min(times * 100, 1000);
      },
      lazyConnect: false,
    });

    redisClient.on('error', (err) => {
      console.warn('[Redis] Connection warning:', err.message);
    });
  }
  return redisClient;
}

// In-memory fallback if Redis has transient network issue
const memoryStore = new Map<string, { value: string; expiresAt?: number }>();

export async function redisSetWithTtl(key: string, value: string, ttlSeconds: number): Promise<void> {
  try {
    const client = getRedisClient();
    await client.set(key, value, 'EX', ttlSeconds);
  } catch (err) {
    console.warn(`[Redis fallback] using memoryStore for set: ${key}`);
    memoryStore.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }
}

export async function redisGet(key: string): Promise<string | null> {
  try {
    const client = getRedisClient();
    return await client.get(key);
  } catch (err) {
    console.warn(`[Redis fallback] using memoryStore for get: ${key}`);
    const item = memoryStore.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      memoryStore.delete(key);
      return null;
    }
    return item.value;
  }
}

export async function redisDel(key: string): Promise<void> {
  try {
    const client = getRedisClient();
    await client.del(key);
  } catch (err) {
    memoryStore.delete(key);
  }
}
