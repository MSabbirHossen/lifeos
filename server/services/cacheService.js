class CacheService {
  constructor() {
    this.memory = new Map();
    this.redisClient = null;
    this.redisEnabled = false;
    this.redisReadyPromise = null;
  }

  async initRedis() {
    if (this.redisReadyPromise) {
      return this.redisReadyPromise;
    }

    this.redisReadyPromise = (async () => {
      const redisUrl = process.env.REDIS_URL;
      if (!redisUrl) {
        this.redisEnabled = false;
        return null;
      }

      try {
        // Optional dependency for future scaling; memory remains fallback.
        // eslint-disable-next-line global-require, import/no-extraneous-dependencies
        const { createClient } = require("redis");
        const client = createClient({ url: redisUrl });
        client.on("error", () => {
          this.redisEnabled = false;
        });
        await client.connect();
        this.redisClient = client;
        this.redisEnabled = true;
        return client;
      } catch (_error) {
        this.redisEnabled = false;
        return null;
      }
    })();

    return this.redisReadyPromise;
  }

  async get(key) {
    if (this.redisEnabled && this.redisClient) {
      try {
        const value = await this.redisClient.get(key);
        if (value) {
          return JSON.parse(value);
        }
      } catch (_error) {
        this.redisEnabled = false;
      }
    }

    const value = this.memory.get(key);
    if (!value) return null;
    if (value.expiresAt <= Date.now()) {
      this.memory.delete(key);
      return null;
    }
    return value.payload;
  }

  async set(key, payload, ttlMs) {
    if (this.redisEnabled && this.redisClient) {
      try {
        const ttlSeconds = Math.max(1, Math.ceil(ttlMs / 1000));
        await this.redisClient.set(key, JSON.stringify(payload), {
          EX: ttlSeconds,
        });
      } catch (_error) {
        this.redisEnabled = false;
      }
    }

    this.memory.set(key, {
      payload,
      expiresAt: Date.now() + ttlMs,
    });
  }

  async getOrSet(key, ttlMs, factory) {
    const cached = await this.get(key);
    if (cached) {
      return { value: cached, cached: true };
    }

    const nextValue = await factory();
    await this.set(key, nextValue, ttlMs);
    return { value: nextValue, cached: false };
  }

  async clearPrefix(prefix) {
    Array.from(this.memory.keys())
      .filter((key) => key.startsWith(prefix))
      .forEach((key) => this.memory.delete(key));

    if (this.redisEnabled && this.redisClient) {
      try {
        const keys = await this.redisClient.keys(`${prefix}*`);
        if (keys.length) {
          await this.redisClient.del(keys);
        }
      } catch (_error) {
        this.redisEnabled = false;
      }
    }
  }
}

const cacheService = new CacheService();

module.exports = cacheService;
