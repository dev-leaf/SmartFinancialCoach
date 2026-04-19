import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../theme/Theme';
import { SCREEN_NAMES } from '../utils/constants';
import {
  BudgetsStackParamList,
  CoachStackParamList,
  DashboardStackParamList,
  ExpensesStackParamList,
  InvestmentsStackParamList,
  MainTabParamList,
  ProfileStackParamList,
} from './types';

/**
 * Bottom Tab Navigator
 * Main app navigation with tabs for Dashboard, Expenses, Budgets, Profile
 */

const Tab = createBottomTabNavigator<MainTabParamList>();
const DashboardStackNavigator = createNativeStackNavigator<DashboardStackParamList>();
const ExpensesStackNavigator = createNativeStackNavigator<ExpensesStackParamList>();
const BudgetsStackNavigator = createNativeStackNavigator<BudgetsStackParamList>();
const InvestmentsStackNavigator = createNativeStackNavigator<InvestmentsStackParamList>();
const CoachStackNavigator = createNativeStackNavigator<CoachStackParamList>();
const ProfileStackNavigator = createNativeStackNavigator<ProfileStackParamList>();

console.log('✅ BottomTabNavigator loaded - using MinimalDashboardScreen');

// Dashboard Stack
function DashboardStack() {
  const { colors } = useAppTheme();

  return (
    <DashboardStackNavigator.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <DashboardStackNavigator.Screen
        name="DashboardHome"
        getComponent={() => require('../screens/dashboard/MinimalDashboardScreen').default}
      />
      <DashboardStackNavigator.Screen
        name="NetWorth"
        getComponent={() => require('../screens/networth/NetWorthScreen').default}
      />
      <DashboardStackNavigator.Screen
        name="Upgrade"
        getComponent={() => require('../screens/PremiumUpgradeScreen').PremiumUpgradeScreen}
      />
    </DashboardStackNavigator.Navigator>
  );
}

// Expenses Stack
function ExpensesStack() {
  const { colors } = useAppTheme();

  return (
    <ExpensesStackNavigator.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <ExpensesStackNavigator.Screen
        name="ExpenseListRoot"
        getComponent={() => require('../screens/expenses/ExpenseListScreen').default}
        options={{ headerTitle: 'Expenses' }}
      />
      <ExpensesStackNavigator.Screen
        name={SCREEN_NAMES.ADD_EXPENSE}
        getComponent={() => require('../screens/expenses/AddExpenseScreen').default}
        options={{
          headerTitle: 'Add Expense',
          presentation: 'modal',
        }}
      />
      <ExpensesStackNavigator.Screen
        name={SCREEN_NAMES.EDIT_EXPENSE}
        getComponent={() => require('../screens/expenses/EditExpenseScreen').default}
        options={{
          headerTitle: 'Edit Expense',
          presentation: 'modal',
        }}
      />
    </ExpensesStackNavigator.Navigator>
  );
}

// Budgets Stack
function BudgetsStack() {
  const { colors } = useAppTheme();

  return (
    <BudgetsStackNavigator.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <BudgetsStackNavigator.Screen
        name="BudgetRoot"
        getComponent={() => require('../screens/budgets/BudgetScreen').default}
      />
      <BudgetsStackNavigator.Screen
        name={SCREEN_NAMES.SET_BUDGET}
        getComponent={() => require('../screens/budgets/SetBudgetScreen').default}
        options={{
          headerShown: true,
          headerTitle: 'Set Budget',
          presentation: 'modal',
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.text,
        }}
      />
    </BudgetsStackNavigator.Navigator>
  );
}

// Investments Stack
function InvestmentsStack() {
  const { colors } = useAppTheme();

  return (
    <InvestmentsStackNavigator.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <InvestmentsStackNavigator.Screen
        name="InvestmentsRoot"
        getComponent={() => require('../screens/InvestmentsScreen').InvestmentsScreen}
      />
    </InvestmentsStackNavigator.Navigator>
  );
}

// Profile Stack
function ProfileStack() {
  const { colors } = useAppTheme();

  return (
    <ProfileStackNavigator.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <ProfileStackNavigator.Screen
        name="ProfileRoot"
        getComponent={() => require('../screens/profile/ProfileScreen').default}
      />
      <ProfileStackNavigator.Screen
        name="Onboarding"
        getComponent={() => require('../screens/onboarding/OnboardingFlowScreen').default}
      />
      <ProfileStackNavigator.Screen
        name="Subscription"
        getComponent={() => require('../screens/subscription/SubscriptionScreen').SubscriptionScreen}
      />
    </ProfileStackNavigator.Navigator>
  );
}

// Coach Stack
function CoachStack() {
  const { colors } = useAppTheme();

  return (
    <CoachStackNavigator.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <CoachStackNavigator.Screen
        name="CoachRoot"
        getComponent={() => require('../screens/coach/ChatScreen').default}
      />
    </CoachStackNavigator.Navigator>
  );
}

export default function BottomTabNavigator() {
  const { colors, radii } = useAppTheme();

  // Tab configuration with proper sizing
  const tabBarIconSize = 24;
  const tabBarHeight = Platform.OS === 'ios' ? 88 : 76;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => {
          let iconName: React.ComponentProps<typeof MaterialCommunityIcons>['name'] =
            'view-dashboard-outline';

          if (route.name === 'DashboardTab') {
            iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
          } else if (route.name === 'ExpensesTab') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'BudgetsTab') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'InvestmentsTab') {
            iconName = focused ? 'trending-up' : 'trending-up';
          } else if (route.name === 'CoachTab') {
            iconName = focused ? 'robot-happy' : 'robot-happy-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'account' : 'account-outline';
          }

          return (
            <MaterialCommunityIcons
              name={iconName}
              size={tabBarIconSize}
              color={color}
              style={{
                width: tabBarIconSize,
                height: tabBarIconSize,
              }}
            />
          );
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          height: tabBarHeight,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 24 : 12,
          paddingHorizontal: 0,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
          borderTopLeftRadius: radii.lg,
          borderTopRightRadius: radii.lg,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 6,
          maxWidth: '100%',
          textAlign: 'center',
          letterSpacing: 0,
        },
        // Prevent label truncation
        tabBarItemStyle: {
          flex: 1,
          paddingVertical: 8,
          paddingHorizontal: 0,
          overflow: 'visible',
        },
      })}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardStack}
        options={{
          title: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="ExpensesTab"
        component={ExpensesStack}
        options={{
          title: 'Expenses',
        }}
      />
      <Tab.Screen
        name="BudgetsTab"
        component={BudgetsStack}
        options={{
          title: 'Budgets',
        }}
      />
      <Tab.Screen
        name="InvestmentsTab"
        component={InvestmentsStack}
        options={{
          title: 'Invest',
        }}
      />
      <Tab.Screen
        name="CoachTab"
        component={CoachStack}
        options={{
          title: 'Coach',
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          title: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}
