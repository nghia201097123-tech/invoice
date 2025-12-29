import { Injectable, Logger } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { getQueueToken } from "@nestjs/bull";
import { Queue } from "bullmq";
import { TaskEnum } from "../enums/task.enum";
import { CacheService } from "src/redis/services/cache.service";

@Injectable()
export class QueueManagerService {
  private readonly logger = new Logger(QueueManagerService.name);
  private restaurantQueues: Map<string, Queue> = new Map();

  constructor(
    private readonly moduleRef: ModuleRef,
    private cacheService: CacheService
  ) {}

  /**
   * Tạo hoặc lấy queue riêng cho từng nhà hàng
   */
  async getOrCreateRestaurantQueue(restaurantId: number): Promise<Queue> {
    const queueName = `${TaskEnum.INVOICE_QUEUE_SEND}`;

    if (this.restaurantQueues.has(queueName)) {
      this.logger.debug(
        `[QUEUE-MANAGER] Using existing queue for restaurant ${restaurantId}`,
        {
          restaurantId,
          queueName,
          totalQueues: this.restaurantQueues.size,
        }
      );
      return this.restaurantQueues.get(queueName);
    }

    this.logger.log(
      `[QUEUE-MANAGER] Creating new queue for restaurant ${restaurantId}`,
      {
        restaurantId,
        queueName,
      }
    );

    const queue = new Queue(queueName, {
      connection: {
        host: process.env.CONFIG_REDIS_HOST_INVOICE || "localhost",
        port: parseInt(process.env.CONFIG_REDIS_PORT_INVOICE) || 6379,
        password: process.env.CONFIG_REDIS_PASSWORD_INVOICE,
        db: parseInt(process.env.CONFIG_REDIS_DB_INDEX_INVOICE) || 0,
      },
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 50,
        attempts: 5,
        backoff: {
          type: "exponential",
          delay: 300,
        },
      },
    });

    this.restaurantQueues.set(queueName, queue);

    this.logger.log(
      `[QUEUE-MANAGER] Successfully created queue for restaurant ${restaurantId}`,
      {
        restaurantId,
        queueName,
        totalQueues: this.restaurantQueues.size,
      }
    );

    return queue;
  }

  /**
   * Lấy thống kê queue cho nhà hàng
   */
  async getRestaurantQueueStats(restaurantId: number): Promise<any> {
    try {
      const queue = await this.getOrCreateRestaurantQueue(restaurantId);
      const waiting = await queue.getWaiting();
      const active = await queue.getActive();
      const completed = await queue.getCompleted();
      const failed = await queue.getFailed();

      return {
        restaurantId,
        queueName: queue.name,
        stats: {
          waiting: waiting.length,
          active: active.length,
          completed: completed.length,
          failed: failed.length,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get queue stats for restaurant ${restaurantId}:`,
        error
      );
      return null;
    }
  }

  /**
   * Lấy thống kê tất cả queue nhà hàng
   */
  async getAllRestaurantQueueStats(): Promise<any[]> {
    const stats = [];

    for (const [queueKey, queue] of this.restaurantQueues.entries()) {
      const restaurantId = queueKey.replace("restaurant_", "");
      const queueStats = await this.getRestaurantQueueStats(+restaurantId);
      if (queueStats) {
        stats.push(queueStats);
      }
    }

    return stats;
  }

  /**
   * Dọn dẹp các queue không sử dụng
   */
  async cleanupUnusedQueues(): Promise<void> {
    const startTime = Date.now();
    this.logger.log("[QUEUE-MANAGER] Starting cleanup of unused queues", {
      totalQueues: this.restaurantQueues.size,
    });

    try {
      const activeRestaurants = await this.getActiveRestaurants();
      const activeRestaurantIds = new Set(
        activeRestaurants.map((r) => r.toString())
      );

      let cleanedCount = 0;
      const queuesToCleanup = [];

      for (const [queueName, queue] of this.restaurantQueues.entries()) {
        // Extract restaurant ID from queue name
        const match = queueName.match(/_restaurant_(\d+)$/);
        if (match) {
          const restaurantId = match[1];

          if (!activeRestaurantIds.has(restaurantId)) {
            queuesToCleanup.push({ queueName, restaurantId, queue });
          }
        }
      }

      this.logger.log(
        `[QUEUE-MANAGER] Found ${queuesToCleanup.length} unused queues to cleanup`,
        {
          totalQueues: this.restaurantQueues.size,
          activeRestaurants: activeRestaurantIds.size,
          unusedQueues: queuesToCleanup.length,
        }
      );

      for (const { queueName, restaurantId, queue } of queuesToCleanup) {
        try {
          await queue.close();
          this.restaurantQueues.delete(queueName);
          cleanedCount++;

          this.logger.log(
            `[QUEUE-MANAGER] Cleaned up unused queue for restaurant ${restaurantId}`,
            {
              restaurantId,
              queueName,
            }
          );
        } catch (error) {
          this.logger.error(
            `[QUEUE-MANAGER] Failed to cleanup queue for restaurant ${restaurantId}`,
            {
              restaurantId,
              queueName,
              error: error.message,
            }
          );
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(`[QUEUE-MANAGER] Cleanup completed in ${duration}ms`, {
        cleanedQueues: cleanedCount,
        remainingQueues: this.restaurantQueues.size,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`[QUEUE-MANAGER] Cleanup failed after ${duration}ms`, {
        error: error.message,
        stack: error.stack,
        duration,
      });
      throw error;
    }
  }

  /**
   * Pause queue của nhà hàng
   */
  async pauseRestaurantQueue(restaurantId: number): Promise<void> {
    try {
      const queue = await this.getOrCreateRestaurantQueue(restaurantId);
      await queue.pause();
      this.logger.log(`Paused queue for restaurant ${restaurantId}`);
    } catch (error) {
      this.logger.error(
        `Failed to pause queue for restaurant ${restaurantId}:`,
        error
      );
    }
  }

  /**
   * Resume queue của nhà hàng
   */
  async resumeRestaurantQueue(restaurantId: number): Promise<void> {
    try {
      const queue = await this.getOrCreateRestaurantQueue(restaurantId);
      await queue.resume();
      this.logger.log(`Resumed queue for restaurant ${restaurantId}`);
    } catch (error) {
      this.logger.error(
        `Failed to resume queue for restaurant ${restaurantId}:`,
        error
      );
    }
  }

  /**
   * Lấy danh sách nhà hàng đang hoạt động
   * TODO: Implement logic to get active restaurants from database
   */
  private async getActiveRestaurants(): Promise<number[]> {
    this.logger.debug("[QUEUE-MANAGER] Getting active restaurants");
    try {
      const restaurantUseInvoiceServiceKey: string =
        "techres/restaurant_invoice/info";
      return await this.cacheService.getCachedData(
        restaurantUseInvoiceServiceKey
      );
    } catch (error) {
      this.logger.error("[QUEUE-MANAGER] Failed to get active restaurants", {
        error: error.message,
        stack: error.stack,
      });
      return [];
    }
  }

  /**
   * Lấy queue mặc định cho fallback
   */
  getDefaultQueue(): Queue {
    this.logger.debug("[QUEUE-MANAGER] Getting default queue for fallback", {
      queueToken: TaskEnum.INVOICE_SEND_THIRD_PARTY_QUEUE,
    });

    try {
      const defaultQueue = this.moduleRef.get(
        getQueueToken(TaskEnum.INVOICE_SEND_THIRD_PARTY_QUEUE)
      );
      this.logger.debug("[QUEUE-MANAGER] Successfully retrieved default queue");
      return defaultQueue;
    } catch (error) {
      this.logger.error("[QUEUE-MANAGER] Failed to get default queue", {
        error: error.message,
        queueToken: TaskEnum.INVOICE_SEND_THIRD_PARTY_QUEUE,
      });
      throw error;
    }
  }
}
