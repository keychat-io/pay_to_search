import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
} from '@nestjs/common';
import { CashuMint, CashuWallet, getDecodedToken } from '@cashu/cashu-ts';
import { RedisService } from './redis.service';

@Injectable()
export class EcashService implements OnModuleInit, OnModuleDestroy {
  constructor(@Inject(RedisService) private redisService: RedisService) {}

  private readonly logger = new Logger(EcashService.name);
  private wallet: CashuWallet;
  private allowMints = [];
  async onModuleInit(): Promise<void> {
    this.allowMints = (process.env.ALLOWED_MINTS || '').split(',');
    const mint = new CashuMint(process.env.MINT_URL);
    this.wallet = new CashuWallet(mint);
  }

  onModuleDestroy(): void {
    // this.redisClient.quit();
  }

  getClient(): CashuWallet {
    return this.wallet;
  }

  async receiveCashu(token: string): Promise<number> {
    const received = await this.wallet.receive(token);
    const amount = received.reduce((acc, proof) => acc + proof.amount, 0);
    console.log('Received proofs:' + amount);
    const result = received.map((proof) => JSON.stringify(proof));
    await this.redisService.getClient().sadd('proofs', result);
    return amount;
  }

  async checkEcashAmount(str: string, minAmount: number): Promise<void> {
    const token = await getDecodedToken(str);
    if (this.allowMints.indexOf(token.mint) == -1) {
      throw new Error('Invalid mint');
    }
    const amount = token.proofs.reduce((acc, proof) => acc + proof.amount, 0);
    if (amount < minAmount) {
      throw new Error('Minimum amount: ' + minAmount);
    }
  }
}
