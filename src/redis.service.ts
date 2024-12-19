import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redisClient: Redis;

  async onModuleInit(): Promise<void> {
    this.redisClient = new Redis(
      parseInt(process.env.REDIS_PORT) || 6379,
      process.env.REDIS_HOST || '127.0.0.1',
    );
    this.redisClient.on('connect', () => {
      this.logger.log('Redis Client Connected');
    });
    this.redisClient.on('error', (error) => {
      this.logger.error(
        `Redis Client Connection Error: ${error.message}`,
        error.stack,
      );
    });
  }

  onModuleDestroy(): void {
    this.redisClient.quit();
  }

  getClient(): Redis {
    return this.redisClient;
  }
}
