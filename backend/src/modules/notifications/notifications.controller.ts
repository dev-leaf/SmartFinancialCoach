import {
  Controller,
  Get,
  Delete,
  Patch,
  Param,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  timestamp: string;
}

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get('unread')
  @HttpCode(HttpStatus.OK)
  async getUnread(@Request() req: ExpressRequest & { user: { id: string } }): Promise<ApiResponse<any[]>> {
    const notifications = await this.notificationsService.getUnread(req.user.id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: `Retrieved ${notifications.length} unread notifications`,
      data: notifications,
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAll(@Request() req: ExpressRequest & { user: { id: string } }): Promise<ApiResponse<any[]>> {
    const notifications = await this.notificationsService.getAll(req.user.id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: `Retrieved ${notifications.length} notifications`,
      data: notifications,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Param('id') id: string): Promise<ApiResponse<any>> {
    const notification = await this.notificationsService.markAsRead(id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Notification marked as read',
      data: notification,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string): Promise<ApiResponse<void>> {
    await this.notificationsService.delete(id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Notification deleted',
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}
