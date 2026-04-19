import { Platform } from 'react-native';

// Backend API Configuration
// Android emulator → 10.0.2.2 maps to host machine's localhost
// iOS simulator / web → localhost works directly
// Physical device → set EXPO_PUBLIC_API_URL in your .env to your machine's local IP
//   e.g. EXPO_PUBLIC_API_URL=http://192.168.1.x:3000
const resolveBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000'; // Android emulator → host machine
  }
  return 'http://localhost:3000'; // iOS simulator or web
};

export const API_BASE_URL = resolveBaseUrl();
export const API_TIMEOUT = 10000; // 10 seconds

// Storage Keys (for secure storage)
export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'user_data',
  REFRESH_TOKEN: 'refresh_token',
};

// Expense Categories
export const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Entertainment',
  'Shopping',
  'Utilities',
  'Healthcare',
  'Education',
  'Other',
];

// Alert Configuration
export const ALERT_THRESHOLDS = {
  SAFE: 0.5, // 0-50%
  CAUTION: 0.75, // 50-75%
  WARNING: 0.9, // 75-90%
  DANGER: 1.0, // 90-100%
};

// Currency
export const CURRENCY_SYMBOL = '\u20B9';
export const CURRENCY_CODE = 'INR';

// Alert Colors
export const ALERT_COLORS = {
  SAFE: '#4CAF50', // Green
  CAUTION: '#FFC107', // Amber
  WARNING: '#FF9800', // Orange
  DANGER: '#F44336', // Red
};

// Screen Names for Navigation
export const SCREEN_NAMES = {
  // Auth
  SPLASH: 'Splash',
  LOGIN: 'Login',
  REGISTER: 'Register',
  
  // Main App
  DASHBOARD: 'Dashboard',
  EXPENSES: 'Expenses',
  BUDGETS: 'Budgets',
  PROFILE: 'Profile',
  
  // Expense Details
  ADD_EXPENSE: 'AddExpense',
  EDIT_EXPENSE: 'EditExpense',
  EXPENSE_DETAIL: 'ExpenseDetail',
  
  // Budget
  SET_BUDGET: 'SetBudget',
} as const;
