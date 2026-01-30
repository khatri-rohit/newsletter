// ==========================================
// REDIS CLIENT - PRODUCTION GRADE v2.0
// ==========================================
// Type-safe singleton Redis client with connection pooling,
// health checks, circuit breaker, and graceful degradation

import { createClient } from 'redis';

// ==========================================
// TYPES & INTERFACES
// ==========================================

// Use proper Redis client type (no generic parameters to avoid conflicts)
type RedisClient = ReturnType<typeof createClient>;

interface RedisConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  maxRetries: number;
  retryDelay: number;
  connectTimeout: number;
  commandTimeout: number;
}

interface HealthStatus {
  isHealthy: boolean;
  lastCheck: number;
  consecutiveFailures: number;
  lastError?: string;
  connectionAttempts: number;
}

interface ConnectionMetrics {
  totalConnections: number;
  failedConnections: number;
  successfulOperations: number;
  failedOperations: number;
  lastConnectionTime?: number;
  uptime: number;
}

// ==========================================
// REDIS CONNECTION MANAGER
// ==========================================

class RedisConnectionManager {
  private static instance: RedisConnectionManager;
  private client: RedisClient | null = null;
  private isConnecting = false;

  private healthStatus: HealthStatus = {
    isHealthy: false,
    lastCheck: 0,
    consecutiveFailures: 0,
    connectionAttempts: 0,
  };

  private metrics: ConnectionMetrics = {
    totalConnections: 0,
    failedConnections: 0,
    successfulOperations: 0,
    failedOperations: 0,
    uptime: 0,
  };

  private config: RedisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    maxRetries: 3,
    retryDelay: 1000,
    connectTimeout: 5000,
    commandTimeout: 3000,
  };

  // Circuit breaker settings
  private readonly MAX_FAILURES = 5;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  private readonly CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute
  private readonly CONNECTION_RETRY_COOLDOWN = 5000; // 5 seconds between retry attempts

  private lastConnectionAttempt = 0;
  private healthCheckInterval?: NodeJS.Timeout;
  private startTime = Date.now();

  private constructor() {
    this.startHealthMonitoring();
    this.logConfiguration();
    // Attempt eager connection on startup (non-blocking)
    this.eagerConnect();
  }

  /**
   * Attempt to connect on startup (non-blocking)
   * This ensures Redis is ready before first request
   */
  private eagerConnect(): void {
    // Use setTimeout to avoid blocking module initialization
    setTimeout(async () => {
      try {
        console.log('[Redis] Initiating eager connection on startup...');
        const client = await this.getClient();
        if (client) {
          console.log('[Redis] ✓ Eager connection successful');
        } else {
          console.warn('[Redis] ⚠ Eager connection failed, will retry on first use');
        }
      } catch (error) {
        console.error('[Redis] Eager connection error:', error);
      }
    }, 100); // 100ms delay to let the app initialize first
  }

  public static getInstance(): RedisConnectionManager {
    if (!RedisConnectionManager.instance) {
      RedisConnectionManager.instance = new RedisConnectionManager();
    }
    return RedisConnectionManager.instance;
  }

  /**
   * Log sanitized configuration on startup
   */
  private logConfiguration(): void {
    console.log('[Redis] Configuration:', {
      host: this.config.host,
      port: this.config.port,
      username: this.config.username || 'default',
      hasPassword: !!this.config.password,
      maxRetries: this.config.maxRetries,
      connectTimeout: `${this.config.connectTimeout}ms`,
      environment: process.env.NODE_ENV || 'development',
    });
  }

  /**
   * Get Redis client with automatic connection handling and type safety
   */
  async getClient(): Promise<RedisClient | null> {
    // Circuit breaker: if too many failures, don't try to connect
    if (this.isCircuitOpen()) {
      console.log('[Redis] Circuit breaker is OPEN, skipping Redis operations');
      return null;
    }

    // Connection cooldown: prevent rapid reconnection attempts
    const timeSinceLastAttempt = Date.now() - this.lastConnectionAttempt;
    if (
      this.healthStatus.consecutiveFailures > 0 &&
      timeSinceLastAttempt < this.CONNECTION_RETRY_COOLDOWN
    ) {
      return null;
    }

    // If already connected and healthy, return existing client
    if (this.client && this.client.isOpen && this.healthStatus.isHealthy) {
      return this.client;
    }

    // If connection is in progress, wait for it
    if (this.isConnecting) {
      await this.waitForConnection();
      return this.client;
    }

    // Attempt to connect
    return await this.connect();
  }

  /**
   * Establish Redis connection with retry logic and proper error handling
   */
  private async connect(): Promise<RedisClient | null> {
    if (this.isConnecting) {
      return null;
    }

    this.isConnecting = true;
    this.lastConnectionAttempt = Date.now();
    this.healthStatus.connectionAttempts++;
    this.metrics.totalConnections++;

    try {
      console.log('[Redis] Attempting connection...', {
        attempt: this.healthStatus.connectionAttempts,
        host: this.config.host,
        port: this.config.port,
      });

      // Create Redis client with proper configuration
      const client = createClient({
        socket: {
          host: this.config.host,
          port: this.config.port,
          connectTimeout: this.config.connectTimeout,
          reconnectStrategy: (retries) => {
            if (retries > this.config.maxRetries) {
              console.error('[Redis] Max connection retries exceeded');
              return new Error('Max retries exceeded');
            }
            const delay = Math.min(retries * this.config.retryDelay, 3000);
            console.log(`[Redis] Retry ${retries}/${this.config.maxRetries} in ${delay}ms`);
            return delay;
          },
        },
        username: this.config.username,
        password: this.config.password,
      });

      // Setup event handlers before connecting
      this.setupEventHandlers(client);

      // Connect with timeout protection
      await this.connectWithTimeout(client);

      // Verify connection is actually working
      await this.verifyConnection(client);

      // Connection successful
      this.client = client;
      this.healthStatus = {
        isHealthy: true,
        lastCheck: Date.now(),
        consecutiveFailures: 0,
        connectionAttempts: this.healthStatus.connectionAttempts,
      };

      this.metrics.lastConnectionTime = Date.now();

      console.log('[Redis] ✓ Successfully connected and verified', {
        totalAttempts: this.healthStatus.connectionAttempts,
      });

      return client;
    } catch (error) {
      this.handleConnectionError(error);
      this.metrics.failedConnections++;
      return null;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Connect with timeout protection
   */
  private async connectWithTimeout(client: RedisClient): Promise<void> {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Connection timeout after ${this.config.connectTimeout}ms`)),
        this.config.connectTimeout
      )
    );

    await Promise.race([client.connect(), timeoutPromise]);
  }

  /**
   * Verify connection is working with PING command
   */
  private async verifyConnection(client: RedisClient): Promise<void> {
    const pingPromise = client.ping();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('PING timeout')), 2000)
    );

    const result = await Promise.race([pingPromise, timeoutPromise]);

    if (result !== 'PONG') {
      throw new Error(`Unexpected PING response: ${result}`);
    }
  }

  /**
   * Setup Redis event handlers for monitoring and debugging
   */
  private setupEventHandlers(client: RedisClient): void {
    client.on('error', (error) => {
      console.error('[Redis] Client error:', error.message);
      this.handleConnectionError(error);
      this.metrics.failedOperations++;
    });

    client.on('connect', () => {
      console.log('[Redis] Socket connected');
    });

    client.on('ready', () => {
      console.log('[Redis] Client ready for commands');
      this.healthStatus = {
        isHealthy: true,
        lastCheck: Date.now(),
        consecutiveFailures: 0,
        connectionAttempts: this.healthStatus.connectionAttempts,
      };
      this.metrics.successfulOperations++;
    });

    client.on('reconnecting', () => {
      console.log('[Redis] Attempting to reconnect...');
    });

    client.on('end', () => {
      console.log('[Redis] Connection closed');
      this.healthStatus.isHealthy = false;
    });
  }

  /**
   * Handle connection errors with proper cleanup
   */
  private handleConnectionError(error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error('[Redis] Connection error:', {
      message: errorMessage,
      consecutiveFailures: this.healthStatus.consecutiveFailures + 1,
      willOpenCircuitBreaker: this.healthStatus.consecutiveFailures + 1 >= this.MAX_FAILURES,
    });

    this.healthStatus = {
      isHealthy: false,
      lastCheck: Date.now(),
      consecutiveFailures: this.healthStatus.consecutiveFailures + 1,
      lastError: errorMessage,
      connectionAttempts: this.healthStatus.connectionAttempts,
    };

    // Cleanup failed client
    if (this.client) {
      this.client
        .quit()
        .catch(() => {
          // Force disconnect if quit fails
          if (this.client?.isOpen) {
            this.client.disconnect();
          }
        })
        .finally(() => {
          this.client = null;
        });
    }
  }

  /**
   * Wait for ongoing connection attempt
   */
  private async waitForConnection(): Promise<void> {
    const maxWait = 5000;
    const checkInterval = 100;
    let waited = 0;

    while (this.isConnecting && waited < maxWait) {
      await new Promise((resolve) => setTimeout(resolve, checkInterval));
      waited += checkInterval;
    }

    if (waited >= maxWait) {
      console.warn('[Redis] Connection wait timeout');
    }
  }

  /**
   * Check if circuit breaker is open (too many failures)
   */
  private isCircuitOpen(): boolean {
    if (this.healthStatus.consecutiveFailures < this.MAX_FAILURES) {
      return false;
    }

    const timeSinceLastFailure = Date.now() - this.healthStatus.lastCheck;

    // Reset circuit breaker after timeout period
    if (timeSinceLastFailure > this.CIRCUIT_BREAKER_TIMEOUT) {
      console.log('[Redis] Circuit breaker timeout reached, resetting...');
      this.healthStatus.consecutiveFailures = 0;
      return false;
    }

    return true;
  }

  /**
   * Start background health monitoring
   */
  private startHealthMonitoring(): void {
    // Clear any existing interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      if (!this.client || !this.client.isOpen) {
        return;
      }

      try {
        const start = Date.now();

        await Promise.race([
          this.client.ping(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Health check timeout')), 2000)
          ),
        ]);

        const latency = Date.now() - start;

        // Reset failure count on successful health check
        if (this.healthStatus.consecutiveFailures > 0) {
          console.log('[Redis] Health check passed, circuit breaker reset', {
            latency: `${latency}ms`,
          });
          this.healthStatus.consecutiveFailures = 0;
        }

        this.healthStatus.isHealthy = true;
        this.healthStatus.lastCheck = Date.now();
        this.metrics.successfulOperations++;
      } catch (error) {
        console.error('[Redis] Health check failed:', error);
        this.handleConnectionError(error);
        this.metrics.failedOperations++;
      }
    }, this.HEALTH_CHECK_INTERVAL);
  }

  /**
   * Get current health status
   */
  getHealthStatus(): HealthStatus {
    return { ...this.healthStatus };
  }

  /**
   * Get connection metrics
   */
  getMetrics(): ConnectionMetrics {
    return {
      ...this.metrics,
      uptime: Date.now() - this.startTime,
    };
  }

  /**
   * Force disconnect (for cleanup/testing)
   */
  async disconnect(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }

    if (this.client && this.client.isOpen) {
      try {
        await this.client.quit();
        console.log('[Redis] Gracefully disconnected');
      } catch (error) {
        console.error('[Redis] Error during disconnect:', error);
        if (this.client.isOpen) {
          this.client.disconnect();
        }
      }
      this.client = null;
    }

    this.healthStatus.isHealthy = false;
  }

  /**
   * Reset metrics (for testing/monitoring)
   */
  resetMetrics(): void {
    this.metrics = {
      totalConnections: 0,
      failedConnections: 0,
      successfulOperations: 0,
      failedOperations: 0,
      uptime: 0,
    };
    this.startTime = Date.now();
  }
}

// ==========================================
// EXPORTS
// ==========================================

export const redisManager = RedisConnectionManager.getInstance();

/**
 * Get Redis client instance (returns null if connection fails or circuit breaker is open)
 */
export async function getRedisClient(): Promise<RedisClient | null> {
  return await redisManager.getClient();
}

/**
 * Get Redis health status
 */
export function getRedisHealth(): HealthStatus {
  return redisManager.getHealthStatus();
}

/**
 * Get Redis connection metrics
 */
export function getRedisMetrics(): ConnectionMetrics {
  return redisManager.getMetrics();
}

/**
 * Gracefully disconnect Redis (useful for testing/cleanup)
 */
export async function disconnectRedis(): Promise<void> {
  await redisManager.disconnect();
}

/**
 * Check if Redis is currently available
 */
export function isRedisAvailable(): boolean {
  const health = redisManager.getHealthStatus();
  return health.isHealthy;
}

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================

if (typeof process !== 'undefined') {
  const shutdown = async (signal: string) => {
    console.log(`[Redis] Received ${signal}, shutting down gracefully...`);
    await redisManager.disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGQUIT', () => shutdown('SIGQUIT'));
}
