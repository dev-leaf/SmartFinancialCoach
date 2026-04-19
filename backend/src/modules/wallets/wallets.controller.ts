import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { WalletDto } from './dto/wallet.dto';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  timestamp: string;
}

@Controller('wallets')
@UseGuards(AuthGuard('jwt'))
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Request() req: ExpressRequest & { user: { id: string } }): Promise<ApiResponse<WalletDto[]>> {
    const wallets = await this.walletsService.findAll(req.user.id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: `Retrieved ${wallets.length} wallets`,
      data: wallets,
      timestamp: new Date().toISOString(),
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Body() createWalletDto: CreateWalletDto,
  ): Promise<ApiResponse<WalletDto>> {
    const wallet = await this.walletsService.create(req.user.id, createWalletDto);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Wallet created successfully',
      data: wallet,
      timestamp: new Date().toISOString(),
    };
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Param('id') id: string,
    @Body() updateWalletDto: UpdateWalletDto,
  ): Promise<ApiResponse<WalletDto>> {
    const wallet = await this.walletsService.update(id, req.user.id, updateWalletDto);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Wallet updated successfully',
      data: wallet,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Param('id') id: string,
  ): Promise<ApiResponse<{ message: string }>> {
    await this.walletsService.delete(id, req.user.id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Wallet deleted successfully',
      data: { message: 'Wallet deleted' },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('rates/:base')
  @HttpCode(HttpStatus.OK)
  async getRates(@Param('base') base: string): Promise<ApiResponse<any>> {
    const rates = await this.walletsService.getExchangeRates(base);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Exchange rates retrieved successfully',
      data: rates,
      timestamp: new Date().toISOString(),
    };
  }
}
