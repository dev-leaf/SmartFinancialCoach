import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { WalletDto } from './dto/wallet.dto';
import axios from 'axios';

@Injectable()
export class WalletsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string): Promise<WalletDto[]> {
    const wallets = await this.prisma.wallet.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return wallets.map(w => this.mapToWalletDto(w));
  }

  async create(userId: string, createWalletDto: CreateWalletDto): Promise<WalletDto> {
    // If it's the first wallet, make it default
    const existing = await this.findAll(userId);
    const isDefault = createWalletDto.isDefault || existing.length === 0;

    const wallet = await this.prisma.wallet.create({
      data: {
        userId,
        name: createWalletDto.name,
        type: createWalletDto.type,
        balance: createWalletDto.balance || 0,
        currency: createWalletDto.currency || 'INR',
        isDefault,
      },
    });

    return this.mapToWalletDto(wallet);
  }

  async update(id: string, userId: string, updateWalletDto: UpdateWalletDto): Promise<WalletDto> {
    // Verify ownership
    const wallet = await this.prisma.wallet.findUnique({ where: { id } });
    if (!wallet || wallet.userId !== userId) {
      throw new NotFoundException('Wallet not found');
    }

    // If setting isDefault, unset others
    if (updateWalletDto.isDefault) {
      await this.prisma.wallet.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const updated = await this.prisma.wallet.update({
      where: { id },
      data: updateWalletDto,
    });

    return this.mapToWalletDto(updated);
  }

  async delete(id: string, userId: string): Promise<void> {
    // Verify ownership
    const wallet = await this.prisma.wallet.findUnique({ where: { id } });
    if (!wallet || wallet.userId !== userId) {
      throw new NotFoundException('Wallet not found');
    }

    await this.prisma.wallet.delete({ where: { id } });
  }

  // Currency API fallback
  async getExchangeRates(base: string = 'INR') {
    try {
      const res = await axios.get(`https://api.frankfurter.app/latest?from=${base}`);
      return res.data;
    } catch (e) {
      // Fallback static rates if offline
      return {
        base,
        rates: {
          USD: 0.012,
          EUR: 0.011,
          GBP: 0.009,
        },
      };
    }
  }

  private mapToWalletDto(wallet: any): WalletDto {
    return {
      id: wallet.id,
      userId: wallet.userId,
      name: wallet.name,
      type: wallet.type,
      balance: wallet.balance,
      currency: wallet.currency,
      isDefault: wallet.isDefault,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }
}
