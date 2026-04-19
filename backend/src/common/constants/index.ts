export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Work',
  'Other',
] as const;

export const BUDGET_ALERT_THRESHOLDS = {
  WARNING_50: 0.5,
  WARNING_80: 0.8,
  CRITICAL_100: 1.0,
} as const;

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
} as const;
