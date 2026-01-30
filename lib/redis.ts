// ==========================================
// REDIS CLIENT CONFIGURATION
// ==========================================

import { createClient } from 'redis';

export type RedisClient = ReturnType<typeof createClient>;

let redisClient: RedisClient | null = null;
let isConnecting = false;

/**
 * Get or create Redis client instance (Singleton pattern)
 * Handles connection management with automatic reconnection
 */
export async function getRedisClient(): Promise<RedisClient> {
  // Return existing client if already connected
  if (redisClient?.isReady) {
    return redisClient;
  }

  // If already connecting, wait for connection
  if (isConnecting && redisClient) {
    while (isConnecting) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (redisClient?.isReady) {
      return redisClient;
    }
  }

  isConnecting = true;

  try {
    // Create new client if not exists
    if (!redisClient) {
      redisClient = createClient({
        username: process.env.REDIS_USERNAME || 'default',
        password: process.env.REDIS_PASSWORD,
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          connectTimeout: 5000, // 5 second timeout
          reconnectStrategy: (retries) => {
            // Stop reconnecting after 3 attempts
            if (retries > 3) {
              console.log('[Redis] Max reconnection attempts reached, giving up');
              return false;
            }
            // Exponential backoff with max 3 seconds
            const delay = Math.min(retries * 100, 3000);
            console.log(`[Redis] Reconnecting in ${delay}ms (attempt ${retries})...`);
            return delay;
          },
        },
      });

      // Error handling
      redisClient.on('error', (err) => {
        console.error('[Redis] Client Error:', err.message);
      });

      redisClient.on('connect', () => {
        console.log('[Redis] Client connected');
      });

      redisClient.on('ready', () => {
        console.log('[Redis] Client ready');
      });

      redisClient.on('reconnecting', () => {
        console.log('[Redis] Client reconnecting...');
      });

      redisClient.on('end', () => {
        console.log('[Redis] Client connection closed');
      });
    }

    // Connect if not connected
    if (!redisClient.isOpen && !redisClient.isReady) {
      await redisClient.connect();
      console.log('[Redis] Successfully connected to Redis server');
    }

    isConnecting = false;
    return redisClient;
  } catch (error) {
    isConnecting = false;
    console.error('[Redis] Failed to connect:', error);
    throw error;
  }
}

/**
 * Gracefully disconnect Redis client
 */
export async function disconnectRedis(): Promise<void> {
  if (redisClient?.isOpen) {
    try {
      await redisClient.quit();
      console.log('[Redis] Client disconnected gracefully');
    } catch (error) {
      console.error('[Redis] Error during disconnect:', error);
    }
  }
  redisClient = null;
}

/**
 * Check if Redis is available
 */
export async function isRedisAvailable(): Promise<boolean> {
  try {
    const client = await getRedisClient();
    await client.ping();
    return true;
  } catch (error) {
    console.error('[Redis] Availability check failed:', error);
    return false;
  }
}

/**
 * Flush all Redis data (use with caution!)
 */
export async function flushRedis(): Promise<void> {
  try {
    const client = await getRedisClient();
    await client.flushAll();
    console.log('[Redis] All data flushed');
  } catch (error) {
    console.error('[Redis] Error flushing data:', error);
    throw error;
  }
}

// Handle process termination
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    await disconnectRedis();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await disconnectRedis();
    process.exit(0);
  });
}
