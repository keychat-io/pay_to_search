import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { ConfigModule } from '@nestjs/config';
import { EcashService } from './ecash.service';
import { RedisService } from './redis.service';

@Module({
  imports: [
    ConfigModule.forRoot({ ignoreEnvFile: true, load: [configuration] }),
  ],
  controllers: [AppController],
  providers: [AppService, RedisService, EcashService],
})
export class AppModule {}
