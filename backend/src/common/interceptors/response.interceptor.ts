import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode || HttpStatus.OK;

    return next.handle().pipe(
      map((data) => {
        // If data already has the response structure, return it as is
        if (data && data.success !== undefined && data.statusCode !== undefined) {
          return data;
        }

        // Otherwise, wrap it
        return {
          success: true,
          statusCode,
          message: 'Success',
          data: data || null,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
