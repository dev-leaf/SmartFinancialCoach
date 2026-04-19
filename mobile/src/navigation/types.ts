import { NavigatorScreenParams } from '@react-navigation/native';

import { Expense } from '../types/expense';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type DashboardStackParamList = {
  DashboardHome: undefined;
  NetWorth: undefined;
  Upgrade: undefined;
};

export type ExpensesStackParamList = {
  ExpenseListRoot: undefined;
  AddExpense: undefined;
  EditExpense: { expense: Expense };
};

export type BudgetsStackParamList = {
  BudgetRoot: undefined;
  SetBudget: undefined;
};

export type CoachStackParamList = {
  CoachRoot: undefined;
};

export type ProfileStackParamList = {
  ProfileRoot: undefined;
  Onboarding: undefined;
  Subscription: undefined;
};

export type InvestmentsStackParamList = {
  InvestmentsRoot: undefined;
};

export type MainTabParamList = {
  DashboardTab: NavigatorScreenParams<DashboardStackParamList>;
  ExpensesTab: NavigatorScreenParams<ExpensesStackParamList>;
  BudgetsTab: NavigatorScreenParams<BudgetsStackParamList>;
  InvestmentsTab: NavigatorScreenParams<InvestmentsStackParamList>;
  CoachTab: NavigatorScreenParams<CoachStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};
