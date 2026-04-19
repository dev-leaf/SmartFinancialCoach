import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private isConnected = false;

  async onModuleInit() {
    try {
      await this.$connect();
      this.isConnected = true;
      console.log('✓ Database connected successfully');
    } catch (error) {
      console.warn('⚠️  Database connection failed (optional):');
      console.warn(error.message);
      console.log('⚠️  Continuing without database. Setup PostgreSQL later.');
      this.isConnected = false;
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.$disconnect();
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production!');
    }

    const models = Reflect.getMetadata('prisma:models', PrismaClient.prototype);

    return Promise.all(
      Object.values(this).map((model: any) => {
        if (model.$executeRawUnsafe) {
          return model.$executeRawUnsafe(`TRUNCATE TABLE \\"${model.name}\\" CASCADE;`);
        }
      }),
    );
  }
}
