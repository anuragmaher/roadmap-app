const redis = require('redis');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // Skip Redis connection if no URL provided (for serverless without Redis)
      if (!process.env.REDIS_URL) {
        console.log('No REDIS_URL provided - running without cache');
        this.isConnected = false;
        return false;
      }

      // Create Redis client with environment-based configuration
      const redisConfig = {
        url: process.env.REDIS_URL,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.log('Redis server connection refused');
            return new Error('Redis server connection refused');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            console.log('Redis retry time exhausted');
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            console.log('Redis max attempts reached');
            return undefined;
          }
          // Reconnect after
          return Math.min(options.attempt * 100, 3000);
        }
      };

      this.client = redis.createClient(redisConfig);

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Connected to Redis');
        this.isConnected = true;
      });

      this.client.on('reconnecting', () => {
        console.log('Reconnecting to Redis...');
      });

      this.client.on('end', () => {
        console.log('Redis connection closed');
        this.isConnected = false;
      });

      await this.client.connect();
      return true;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.isConnected = false;
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      try {
        await this.client.disconnect();
        console.log('Disconnected from Redis');
      } catch (error) {
        console.error('Error disconnecting from Redis:', error);
      }
    }
  }

  isReady() {
    return this.isConnected && this.client && this.client.isReady;
  }

  // Generic cache methods
  async get(key) {
    if (!this.isReady()) {
      console.warn('Redis not available, skipping cache get');
      return null;
    }

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async set(key, value, ttlSeconds = 86400) {
    if (!this.isReady()) {
      console.warn('Redis not available, skipping cache set');
      return false;
    }

    try {
      await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  }

  async del(key) {
    if (!this.isReady()) {
      console.warn('Redis not available, skipping cache delete');
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis DELETE error:', error);
      return false;
    }
  }

  async delPattern(pattern) {
    if (!this.isReady()) {
      console.warn('Redis not available, skipping cache delete pattern');
      return false;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Redis DELETE PATTERN error:', error);
      return false;
    }
  }

  // Roadmap-specific cache methods
  generateHomeDataKey(tenantId, hostname) {
    return `home_data:${tenantId || 'main'}:${hostname}`;
  }

  async getHomeData(tenantId, hostname) {
    const key = this.generateHomeDataKey(tenantId, hostname);
    return await this.get(key);
  }

  async setHomeData(tenantId, hostname, data, ttlSeconds = 86400) {
    const key = this.generateHomeDataKey(tenantId, hostname);
    return await this.set(key, data, ttlSeconds);
  }

  async invalidateHomeData(tenantId) {
    // Invalidate all home data for a specific tenant
    const pattern = `home_data:${tenantId || 'main'}:*`;
    return await this.delPattern(pattern);
  }

  async invalidateAllHomeData() {
    // Invalidate all home data cache
    return await this.delPattern('home_data:*');
  }
}

// Create singleton instance
const redisService = new RedisService();

module.exports = redisService;