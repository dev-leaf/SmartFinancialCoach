/**
 * CRITICAL FIX P1: Input Validation & Sanitization
 * 
 * Comprehensive validation for all user inputs:
 * 1. Type validation
 * 2. Range validation
 * 3. Format validation
 * 4. SQL injection prevention
 * 5. XSS prevention
 * 6. Business logic validation
 * 
 * Use case:
 * - User submits expense amount as "DROP TABLE users"
 * - Validates input is number, positive, reasonable
 * - Sanitizes for database and API responses
 * - Prevents SQL injection and XSS
 */

import { BadRequestException } from '@nestjs/common';

/**
 * Input validators for financial app
 */
export class InputValidator {
  /**
   * Validate amount (must be positive, max 10M)
   */
  static validateAmount(
    amount: any,
    fieldName: string = 'amount',
    options?: { min?: number; max?: number },
  ): number {
    const min = options?.min ?? 0.01;
    const max = options?.max ?? 10000000; // 10 million

    // Type check
    const parsed = parseFloat(amount);
    if (Number.isNaN(parsed)) {
      throw new BadRequestException(
        `${fieldName} must be a valid number. Got: ${amount}`,
      );
    }

    // Range check
    if (parsed < min || parsed > max) {
      throw new BadRequestException(
        `${fieldName} must be between ${min} and ${max}. Got: ${parsed}`,
      );
    }

    // Precision check (max 2 decimal places for currency)
    const precision = (parsed.toString().split('.')[1] || '').length;
    if (precision > 2) {
      throw new BadRequestException(
        `${fieldName} can have maximum 2 decimal places. Got: ${parsed}`,
      );
    }

    return parsed;
  }

  /**
   * Validate string (non-empty, max length)
   */
  static validateString(
    value: any,
    fieldName: string = 'value',
    options?: { minLength?: number; maxLength?: number },
  ): string {
    const min = options?.minLength ?? 1;
    const max = options?.maxLength ?? 500;

    // Type check
    if (typeof value !== 'string') {
      throw new BadRequestException(
        `${fieldName} must be a string. Got: ${typeof value}`,
      );
    }

    // Trim whitespace
    const trimmed = value.trim();

    // Length check
    if (trimmed.length < min || trimmed.length > max) {
      throw new BadRequestException(
        `${fieldName} must be between ${min} and ${max} characters. Got: ${trimmed.length}`,
      );
    }

    return trimmed;
  }

  /**
   * Validate email format
   */
  static validateEmail(email: any): string {
    const validated = this.validateString(email, 'email', { maxLength: 255 });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(validated)) {
      throw new BadRequestException(`Invalid email format: ${email}`);
    }

    return validated.toLowerCase();
  }

  /**
   * Validate date (ISO format or timestamp)
   */
  static validateDate(
    value: any,
    fieldName: string = 'date',
    options?: { minDate?: Date; maxDate?: Date },
  ): Date {
    let date: Date;

    if (typeof value === 'string') {
      date = new Date(value);
    } else if (typeof value === 'number') {
      date = new Date(value);
    } else if (value instanceof Date) {
      date = value;
    } else {
      throw new BadRequestException(
        `${fieldName} must be a date string or timestamp. Got: ${typeof value}`,
      );
    }

    // Check validity
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(
        `${fieldName} is not a valid date. Got: ${value}`,
      );
    }

    // Range check
    if (options?.minDate && date < options.minDate) {
      throw new BadRequestException(
        `${fieldName} must be after ${options.minDate.toISOString()}. Got: ${date.toISOString()}`,
      );
    }

    if (options?.maxDate && date > options.maxDate) {
      throw new BadRequestException(
        `${fieldName} must be before ${options.maxDate.toISOString()}. Got: ${date.toISOString()}`,
      );
    }

    return date;
  }

  /**
   * Validate enum value
   */
  static validateEnum<T extends Record<string, any>>(
    value: any,
    enumObj: T,
    fieldName: string = 'value',
  ): T[keyof T] {
    const validValues = Object.values(enumObj) as string[];

    if (!validValues.includes(value)) {
      throw new BadRequestException(
        `${fieldName} must be one of: ${validValues.join(', ')}. Got: ${value}`,
      );
    }

    return value as T[keyof T];
  }

  /**
   * Validate currency code (ISO 4217)
   */
  static validateCurrency(currency: any): string {
    const validated = this.validateString(currency, 'currency', {
      minLength: 3,
      maxLength: 3,
    }).toUpperCase();

    const validCurrencies = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD'];
    if (!validCurrencies.includes(validated)) {
      throw new BadRequestException(
        `Currency must be one of: ${validCurrencies.join(', ')}. Got: ${currency}`,
      );
    }

    return validated;
  }

  /**
   * Validate expense category
   */
  static validateExpenseCategory(category: any): string {
    const validated = this.validateString(category, 'category', {
      minLength: 2,
      maxLength: 50,
    });

    const validCategories = [
      'food',
      'transport',
      'shopping',
      'entertainment',
      'utilities',
      'health',
      'education',
      'investment',
      'salary',
      'bonus',
      'other',
    ];

    if (!validCategories.includes(validated.toLowerCase())) {
      throw new BadRequestException(
        `Invalid category: ${category}. Must be one of: ${validCategories.join(', ')}`,
      );
    }

    return validated.toLowerCase();
  }

  /**
   * Validate UUID format
   */
  static validateUUID(id: any, fieldName: string = 'id'): string {
    const validated = this.validateString(id, fieldName);

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(validated)) {
      throw new BadRequestException(
        `${fieldName} must be a valid UUID. Got: ${id}`,
      );
    }

    return validated;
  }

  /**
   * Validate idempotency key format
   */
  static validateIdempotencyKey(key: any): string {
    const validated = this.validateString(key, 'idempotencyKey', {
      minLength: 16,
      maxLength: 128,
    });

    // Must be alphanumeric, hyphens, underscores
    const keyRegex = /^[a-zA-Z0-9_-]+$/;
    if (!keyRegex.test(validated)) {
      throw new BadRequestException(
        `idempotencyKey must be alphanumeric with hyphens/underscores. Got: ${key}`,
      );
    }

    return validated;
  }

  /**
   * Sanitize string for display (prevent XSS)
   */
  static sanitizeForDisplay(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  /**
   * Sanitize string for database (prevent SQL injection)
   */
  static sanitizeForDatabase(text: string): string {
    // Remove null bytes
    let sanitized = text.replace(/\0/g, '');

    // SQL injection characters - these should not appear in user input
    const dangerousPatterns = [
      /\b(DROP|DELETE|INSERT|UPDATE|SELECT|UNION|OR|AND)\b/gi,
      /(['";]|--|\/\*|\*\/|xp_|sp_)/,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(sanitized)) {
        throw new BadRequestException(
          `Invalid characters in input: ${text.substring(0, 50)}...`,
        );
      }
    }

    return sanitized;
  }

  /**
   * Batch validate expense creation
   */
  static validateExpenseInput(data: any) {
    const amount = this.validateAmount(data.amount);
    const category = this.validateExpenseCategory(data.category);
    const description = data.description
      ? this.validateString(data.description, 'description', { maxLength: 500 })
      : null;
    const currency = data.currency
      ? this.validateCurrency(data.currency)
      : 'INR';
    const date = data.date ? this.validateDate(data.date, 'date') : new Date();
    const idempotencyKey = data.idempotencyKey
      ? this.validateIdempotencyKey(data.idempotencyKey)
      : null;

    return {
      amount,
      category,
      description,
      currency,
      date,
      idempotencyKey,
    };
  }

  /**
   * Batch validate payment input
   */
  static validatePaymentInput(data: any) {
    const amount = this.validateAmount(data.amount, 'amount', {
      min: 99, // Minimum ₹99
      max: 500000, // Maximum ₹5,00,000
    });
    const plan = this.validateEnum(
      data.plan,
      {
        PRO_MONTHLY: 'pro_monthly',
        PRO_YEARLY: 'pro_yearly',
      },
      'plan',
    );
    const idempotencyKey = this.validateIdempotencyKey(data.idempotencyKey);

    return {
      amount,
      plan,
      idempotencyKey,
    };
  }
}

/**
 * Validation error messages
 */
export const ValidationMessages = {
  INVALID_AMOUNT: 'Amount must be a positive number',
  INVALID_EMAIL: 'Invalid email address',
  INVALID_DATE: 'Invalid date format',
  INVALID_CATEGORY: 'Invalid expense category',
  INVALID_CURRENCY: 'Invalid currency code',
  INVALID_UUID: 'Invalid user or wallet ID',
  AMOUNT_TOO_LOW: 'Amount must be at least 0.01',
  AMOUNT_TOO_HIGH: 'Amount exceeds maximum allowed',
  INVALID_CHARACTERS: 'Input contains invalid characters',
};
