import { Injectable, Logger } from "@nestjs/common";
import { InjectRedis } from "@liaoliaots/nestjs-redis";
import { Redis } from "ioredis";

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@InjectRedis("redis") private readonly cacheManager: Redis) {}

  /**
   * Get cached data from Redis
   * @param key Cache key
   * @returns Cached data or null if not found
   */
  async getCachedData(key: string): Promise<any> {
    try {
      const cachedData = await this.cacheManager.get(key);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      return null;
    } catch (error) {
      this.logger.error(`Error getting cached data for key ${key}:`, error);
      return null;
    }
  }
  /**
   * Set data to Redis cache with TTL
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Time to live in seconds
   */
  async setCachedData(key: string, data: any, ttl: number): Promise<void> {
    try {
      await this.cacheManager.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      this.logger.error(`Error setting cached data for key ${key}:`, error);
    }
  }

  /**
   * Set data to Redis cache without TTL
   * @param key Cache key
   * @param data Data to cache
   * @param expireMode Optional expire mode ('EX' for seconds)
   * @param expireTime Optional expire time
   */
  async setCache(
    key: string,
    data: any,
    expireMode?: string,
    expireTime?: number
  ): Promise<void> {
    try {
      if (expireMode && expireTime) {
        await this.cacheManager.set(
          key,
          JSON.stringify(data),
          expireMode as "EX",
          expireTime
        );
      } else {
        await this.cacheManager.set(key, JSON.stringify(data));
      }
    } catch (error) {
      this.logger.error(`Error setting cache for key ${key}:`, error);
    }
  }

  /**
   * Set cache with NX option (set if not exists) for distributed locking
   * @param key Cache key
   * @param data Data to cache
   * @param expireMode Expire mode ('EX' for seconds)
   * @param expireTime Expire time in seconds
   * @param nx NX option (set if not exists)
   * @returns True if the key was set, false if it already exists
   */
  async setCacheWithNX(
    key: string,
    data: any,
    expireMode: string,
    expireTime: number,
    nx: string
  ): Promise<boolean> {
    try {
      const result = await this.cacheManager.set(
        key,
        JSON.stringify(data),
        expireMode as "EX",
        expireTime,
        nx as "NX"
      );
      return result === "OK";
    } catch (error) {
      this.logger.error(`Error setting cache with NX for key ${key}:`, error);
      return false;
    }
  }
  /**
   * Delete cache by key
   * @param key Cache key to delete
   */
  async deleteCache(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      this.logger.error(`Error deleting cache for key ${key}:`, error);
    }
  }

  /**
   * Invalidate cache by pattern
   * @param pattern Cache key pattern to invalidate
   */
  async invalidateCache(pattern: string): Promise<void> {
    try {
      const keys = await this.cacheManager.keys(pattern);
      if (keys.length > 0) {
        await this.cacheManager.del(...keys);
      }
    } catch (error) {
      this.logger.error(
        `Error invalidating cache for pattern ${pattern}:`,
        error
      );
    }
  }

  /**
   * Check if order is processed (Set operations)
   * @param orderId Order ID to check
   * @param setKey Redis set key
   * @returns True if order is processed
   */
  async isOrderProcessed(orderId: string, setKey: string): Promise<boolean> {
    try {
      const exists = await this.cacheManager.sismember(setKey, orderId);
      return exists === 1;
    } catch (error) {
      this.logger.error(
        `Failed to check if order ${orderId} is processed`,
        error
      );
      return false;
    }
  }

  /**
   * Mark order as processed (Set operations)
   * @param orderId Order ID to mark
   * @param setKey Redis set key
   * @param expireTime Expire time in seconds
   */
  async markOrderAsProcessed(
    orderId: string,
    setKey: string,
    expireTime: number
  ): Promise<void> {
    try {
      await this.cacheManager.sadd(setKey, orderId);
      await this.cacheManager.expire(setKey, expireTime);
    } catch (error) {
      this.logger.error(`Failed to mark order ${orderId} as processed`, error);
      throw error;
    }
  }

  /**
   * Remove order from processed set
   * @param orderId Order ID to remove
   * @param setKey Redis set key
   */
  async removeOrderFromProcessed(
    orderId: string,
    setKey: string
  ): Promise<void> {
    try {
      await this.cacheManager.srem(setKey, orderId);
    } catch (error) {
      this.logger.error(
        `Failed to remove order ${orderId} from processed`,
        error
      );
    }
  }

  /**
   * Get restaurant brand with caching
   * @param id Restaurant brand ID
   * @param ttl Cache TTL in seconds
   * @param fetchCallback Callback to fetch data if not cached
   * @returns Restaurant brand data
   */
  async getRestaurantBrandCached<T>(
    id: number,
    ttl: number,
    fetchCallback: () => Promise<T>
  ): Promise<T> {
    const cacheKey = `restaurant_brand_${id}`;

    try {
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.warn(`Failed to get cached restaurant brand ${id}`, error);
    }

    const data = await fetchCallback();

    if (!data) {
      throw new Error(`Restaurant brand with ID ${id} not found`);
    }

    // Cache the result
    try {
      await this.cacheManager.setex(cacheKey, ttl, JSON.stringify(data));
    } catch (error) {
      this.logger.warn(`Failed to cache restaurant brand ${id}`, error);
    }

    return data;
  }

  /**
   * Get restaurant partner invoices with caching
   * @param cacheKey Cache key
   * @param ttl Cache TTL in seconds
   * @param fetchCallback Callback to fetch data if not cached
   * @returns Restaurant partner invoices data
   */
  async getRestaurantPartnerInvoicesCached<T>(
    cacheKey: string,
    ttl: number,
    fetchCallback: () => Promise<T>
  ): Promise<T> {
    try {
      const cachedData = await this.cacheManager.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    } catch (error) {
      this.logger.warn(`Failed to get cached data for key ${cacheKey}`, error);
    }

    const data = await fetchCallback();

    try {
      await this.cacheManager.set(cacheKey, JSON.stringify(data), "EX", ttl);
    } catch (error) {
      this.logger.warn(`Failed to cache data for key ${cacheKey}`, error);
    }

    return data;
  }

  /**
   * Get cached authentication data
   * @param cacheKey Cache key for auth data
   * @returns Cached auth data or null
   */
  async getCachedAuth(cacheKey: string): Promise<any> {
    try {
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      this.logger.error(
        `Error getting cached auth data for key ${cacheKey}:`,
        error
      );
      return null;
    }
  }

  /**
   * Cache authentication data with TTL
   * @param cacheKey Cache key for auth data
   * @param authData Auth data to cache
   * @param ttl Time to live in seconds (default: 86400 = 24 hours)
   */
  async cacheAuthData(
    cacheKey: string,
    authData: any,
    ttl: number = 86400
  ): Promise<void> {
    try {
      await this.cacheManager.set(
        cacheKey,
        JSON.stringify({ token: authData }),
        "EX",
        ttl
      );
    } catch (error) {
      this.logger.error(`Error caching auth data for key ${cacheKey}:`, error);
    }
  }

  /**
   * Invalidate all invoice-related caches for a specific restaurant
   * @param restaurant_id Restaurant ID to invalidate caches for
   */
  async invalidateInvoiceCaches(restaurant_id: number): Promise<void> {
    try {
      // Invalidate list caches
      await this.invalidateCache("invoice_list:*");

      // Invalidate count tab caches
      await this.invalidateCache("invoice_count_tab:*");

      // Invalidate invoice details caches
      await this.invalidateCache("invoice_details:*");

      this.logger.log(
        `Invoice caches invalidated for restaurant_id: ${restaurant_id}`
      );
    } catch (error) {
      this.logger.error("Error invalidating invoice caches:", error);
    }
  }

  /**
   * Get restaurant brand by ID with caching
   * @param id Restaurant brand ID
   * @param fetchCallback Callback to fetch data from repository
   * @returns Restaurant brand data
   */
  async getRestaurantBrandById<T>(
    id: number,
    fetchCallback: () => Promise<T>
  ): Promise<T> {
    const restaurantBrandKey = `restaurant_brand_${id}`;
    const data = await this.cacheManager.get(restaurantBrandKey);

    if (data) {
      return JSON.parse(data);
    } else {
      const fetchedData = await fetchCallback();
      await this.cacheManager.set(
        restaurantBrandKey,
        JSON.stringify(fetchedData)
      );
      return fetchedData;
    }
  }

  /**
   * Clear all processed orders
   * @param setKey Redis set key for processed orders
   */
  async clearProcessedOrders(setKey: string): Promise<void> {
    try {
      await this.cacheManager.del(setKey);
    } catch (error) {
      this.logger.error(
        `Failed to clear processed orders for key ${setKey}`,
        error
      );
    }
  }

  /**
   * Get all members from a Redis set
   * @param setKey Redis set key
   * @returns Array of set members
   */
  async smembers(setKey: string): Promise<string[]> {
    try {
      return await this.cacheManager.smembers(setKey);
    } catch (error) {
      this.logger.error(`Failed to get members from set ${setKey}`, error);
      return [];
    }
  }

  /**
   * Add one or more members to a Redis set
   * @param setKey Redis set key
   * @param members Members to add to the set
   * @returns Number of elements added to the set
   */
  async sadd(setKey: string, ...members: string[]): Promise<number> {
    try {
      return await this.cacheManager.sadd(setKey, ...members);
    } catch (error) {
      this.logger.error(`Failed to add members to set ${setKey}`, error);
      return 0;
    }
  }

  /**
   * Set expiration time for a Redis key
   * @param key Redis key
   * @param seconds Expiration time in seconds
   * @returns True if expiration was set successfully
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await this.cacheManager.expire(key, seconds);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to set expiration for key ${key}`, error);
      return false;
    }
  }

  /**
   * Remove one or more members from a Redis set
   * @param setKey Redis set key
   * @param members Members to remove from the set
   * @returns Number of elements removed from the set
   */
  async srem(setKey: string, ...members: string[]): Promise<number> {
    try {
      return await this.cacheManager.srem(setKey, ...members);
    } catch (error) {
      this.logger.error(`Failed to remove members from set ${setKey}`, error);
      return 0;
    }
  }
}
