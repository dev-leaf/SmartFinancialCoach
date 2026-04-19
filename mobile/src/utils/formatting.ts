import { CURRENCY_SYMBOL } from './constants';

/**
 * Format number as currency
 */
export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format date to readable format
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format time to readable format (HH:MM AM/PM)
 */
export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Format date and time together
 */
export const formatDateTime = (dateString: string): string => {
  return `${formatDate(dateString)} ${formatTime(dateString)}`;
};

/**
 * Get month name from month number
 */
export const getMonthName = (month: number): string => {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return months[month - 1] || 'Invalid Month';
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Capitalize first letter of string
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Truncate string to specified length
 */
export const truncate = (str: string, length: number = 20): string => {
  return str.length > length ? str.substring(0, length) + '...' : str;
};

/**
 * Get spending percentage relative to budget
 */
export const getSpendingPercentage = (spending: number, budget: number): number => {
  if (budget === 0) return 0;
  return Math.min((spending / budget) * 100, 100);
};

/**
 * Get remaining budget
 */
export const getRemainingBudget = (budget: number, spending: number): number => {
  return Math.max(budget - spending, 0);
};

export const formatCompactCurrency = (amount: number): string => {
  const absoluteValue = Math.abs(amount);

  if (absoluteValue >= 10000000) {
    return `${CURRENCY_SYMBOL}${(amount / 10000000).toFixed(1)}Cr`;
  }

  if (absoluteValue >= 100000) {
    return `${CURRENCY_SYMBOL}${(amount / 100000).toFixed(1)}L`;
  }

  return formatCurrency(amount);
};
