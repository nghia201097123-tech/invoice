import { Injectable, Logger } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { InjectRedis } from "@liaoliaots/nestjs-redis";
import Redis from "ioredis";
import { DataSource } from "typeorm";

@Injectable()
export class RestaurantService {
  private readonly logger = new Logger(RestaurantService.name);
  private readonly CACHE_TTL = 3600; // 1 hour in seconds

  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @InjectRedis("redis") private readonly cacheManager: Redis
  ) {}

  async findRestaurantByRestaurantId(restaurant_id: number): Promise<any> {
    const cacheKey = `restaurant:${restaurant_id}`;

    try {
      // Try to get from cache first
      const cachedData = await this.cacheManager.get(cacheKey);
      if (cachedData) {
        this.logger.debug(
          `Restaurant data found in cache for ID: ${restaurant_id}`
        );
        return JSON.parse(cachedData);
      }

      // If not in cache, query from database
      this.logger.debug(
        `Restaurant data not in cache, querying database for ID: ${restaurant_id}`
      );
      const restaurantData = await this.dataSource.query(
        `SELECT * FROM restaurants WHERE id = ${restaurant_id}`
      );

      // Cache the result if data exists
      if (restaurantData && restaurantData.length > 0) {
        await this.cacheManager.setex(
          cacheKey,
          this.CACHE_TTL,
          JSON.stringify(restaurantData)
        );
        this.logger.debug(`Restaurant data cached for ID: ${restaurant_id}`);
      }

      return restaurantData;
    } catch (error) {
      this.logger.error(
        `Error getting restaurant data for ID ${restaurant_id}:`,
        error
      );
      // Fallback to database query if cache fails
      return this.dataSource.query(
        `SELECT * FROM restaurants WHERE id = ${restaurant_id}`
      );
    }
  }

  /**
   * Clear restaurant cache by ID
   * @param restaurant_id Restaurant ID
   */
  async clearRestaurantCache(restaurant_id: number): Promise<void> {
    const cacheKey = `restaurant:${restaurant_id}`;
    try {
      await this.cacheManager.del(cacheKey);
      this.logger.debug(`Restaurant cache cleared for ID: ${restaurant_id}`);
    } catch (error) {
      this.logger.error(
        `Error clearing restaurant cache for ID ${restaurant_id}:`,
        error
      );
    }
  }

  /**
   * Refresh restaurant cache by ID
   * @param restaurant_id Restaurant ID
   */
  async refreshRestaurantCache(restaurant_id: number): Promise<any> {
    await this.clearRestaurantCache(restaurant_id);
    return this.findRestaurantByRestaurantId(restaurant_id);
  }
}
