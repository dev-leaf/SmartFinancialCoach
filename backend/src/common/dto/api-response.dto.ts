/**
 * Global API Response Format
 * All endpoints return this structure for consistency
 */
export class ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  timestamp: string;

  constructor(
    success: boolean,
    statusCode: number,
    message: string,
    data: T | null = null,
  ) {
    this.success = success;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }
}
