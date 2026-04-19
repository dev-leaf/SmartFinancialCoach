/**
 * Logging Service - Unified console logging for payment system
 * Shows all payment operations, errors, and debug info
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 500;
  private isDevelopment = __DEV__;

  private getTimestamp(): string {
    return new Date().toLocaleTimeString('en-IN', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  }

  private formatMessage(
    level: LogLevel,
    category: string,
    message: string,
    data?: any
  ): string {
    const timestamp = this.getTimestamp();
    const icon = this.getIcon(level);
    const colorCode = this.getColorCode(level);

    let formatted = `${colorCode}[${timestamp}] ${icon} [${category}] ${message}`;

    if (data) {
      formatted += `\n${JSON.stringify(data, null, 2)}`;
    }

    formatted += '\x1b[0m'; // Reset color
    return formatted;
  }

  private getIcon(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return '🔍';
      case LogLevel.INFO:
        return 'ℹ️';
      case LogLevel.WARN:
        return '⚠️';
      case LogLevel.ERROR:
        return '❌';
      case LogLevel.SUCCESS:
        return '✅';
      default:
        return '•';
    }
  }

  private getColorCode(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return '\x1b[36m'; // Cyan
      case LogLevel.INFO:
        return '\x1b[34m'; // Blue
      case LogLevel.WARN:
        return '\x1b[33m'; // Yellow
      case LogLevel.ERROR:
        return '\x1b[31m'; // Red
      case LogLevel.SUCCESS:
        return '\x1b[32m'; // Green
      default:
        return '\x1b[0m'; // Reset
    }
  }

  private log(
    level: LogLevel,
    category: string,
    message: string,
    data?: any
  ): void {
    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      level,
      category,
      message,
      data,
    };

    // Add to internal log buffer
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Only log to console in development
    if (this.isDevelopment) {
      const formatted = this.formatMessage(level, category, message, data);
      console.log(formatted);
    }
  }

  // ============================================
  // Public API
  // ============================================

  debug(category: string, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, category, message, data);
  }

  info(category: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, category, message, data);
  }

  warn(category: string, message: string, data?: any): void {
    this.log(LogLevel.WARN, category, message, data);
  }

  error(category: string, message: string, data?: any): void {
    this.log(LogLevel.ERROR, category, message, data);
  }

  success(category: string, message: string, data?: any): void {
    this.log(LogLevel.SUCCESS, category, message, data);
  }

  /**
   * Payment-specific logs
   */
  logPaymentOrderCreated(orderId: string, amount: number, planId: string): void {
    this.success('PAYMENT', `Order created: ${orderId}`, {
      orderId,
      amount,
      planId,
    });
  }

  logPaymentVerification(orderId: string, paymentId: string, status: string): void {
    if (status === 'verified') {
      this.success('PAYMENT', `Payment verified: ${paymentId}`, {
        orderId,
        paymentId,
      });
    } else {
      this.error('PAYMENT', `Payment verification failed: ${paymentId}`, {
        orderId,
        paymentId,
      });
    }
  }

  logSignatureVerification(isValid: boolean, signature: string): void {
    if (isValid) {
      this.success('SIGNATURE', 'Signature verification passed');
    } else {
      this.error('SIGNATURE', 'Signature verification failed', {
        signature: signature.substring(0, 20) + '...',
      });
    }
  }

  logWebhookEvent(event: string, data: any): void {
    this.info('WEBHOOK', `Event received: ${event}`, data);
  }

  logSubscriptionUpdate(userId: string, tier: string, status: string): void {
    this.success('SUBSCRIPTION', `Subscription updated for user: ${userId}`, {
      tier,
      status,
    });
  }

  logStorageOperation(operation: string, key: string, success: boolean): void {
    const level = success ? LogLevel.SUCCESS : LogLevel.ERROR;
    this.log(level, 'STORAGE', `${operation}: ${key}`);
  }

  logPaymentStoreAction(action: string, payload?: any): void {
    this.info('STORE', `Action: ${action}`, payload);
  }

  logAPICall(method: string, endpoint: string, statusCode?: number): void {
    const status = statusCode ? `(${statusCode})` : '';
    this.info('API', `${method} ${endpoint} ${status}`);
  }

  logError(category: string, error: any): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    this.error(category, errorMessage, {
      stack: errorStack,
    });
  }

  /**
   * Get all logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs filtered by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * Get logs filtered by category
   */
  getLogsByCategory(category: string): LogEntry[] {
    return this.logs.filter((log) => log.category === category);
  }

  /**
   * Export logs as text
   */
  exportLogs(): string {
    return this.logs
      .map((log) => {
        const icon = this.getIcon(log.level);
        let text = `[${log.timestamp}] ${icon} [${log.category}] ${log.message}`;
        if (log.data) {
          text += `\n${JSON.stringify(log.data, null, 2)}`;
        }
        return text;
      })
      .join('\n\n');
  }

  /**
   * Export logs as JSON
   */
  exportLogsJson(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
    this.info('LOGGER', 'Logs cleared');
  }

  /**
   * Print summary
   */
  printSummary(): void {
    const byLevel = {
      [LogLevel.DEBUG]: this.logs.filter((l) => l.level === LogLevel.DEBUG).length,
      [LogLevel.INFO]: this.logs.filter((l) => l.level === LogLevel.INFO).length,
      [LogLevel.WARN]: this.logs.filter((l) => l.level === LogLevel.WARN).length,
      [LogLevel.ERROR]: this.logs.filter((l) => l.level === LogLevel.ERROR).length,
      [LogLevel.SUCCESS]: this.logs.filter((l) => l.level === LogLevel.SUCCESS).length,
    };

    console.log('\n' + '='.repeat(50));
    console.log('📊 LOG SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Logs: ${this.logs.length}`);
    console.log(`✅ Success: ${byLevel.SUCCESS}`);
    console.log(`❌ Errors: ${byLevel.ERROR}`);
    console.log(`⚠️  Warnings: ${byLevel.WARN}`);
    console.log(`ℹ️  Info: ${byLevel.INFO}`);
    console.log(`🔍 Debug: ${byLevel.DEBUG}`);
    console.log('='.repeat(50) + '\n');
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for use in components
export default logger;
