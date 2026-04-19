import React, { useEffect, useMemo, useState, useCallback, useRef, memo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  Layout,
} from 'react-native-reanimated';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useBudgetStore, useExpenseStore, useWalletStore, useAuthStore } from '../../store';
import { useHealthScoreStore } from '../../store/healthScoreStore';
import { useInsightsStore } from '../../store/insightsStore';
import { useSmartAlertsStore } from '../../store/smartAlertsStore';
import { useNetWorthGraphStore } from '../../store/netWorthGraphStore';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { useWeeklyReportStore } from '../../store/reportStore';
import { useAppTheme } from '../../theme/Theme';
import { spacing, typography } from '../../theme/Theme';
import PressableScale from '../../components/PressableScale';
import { HeroBalance } from '../../components/minimal/HeroBalance';
import { ThinProgressBar } from '../../components/minimal/ThinProgressBar';
import { MinimalTransactionRow } from '../../components/minimal/MinimalTransactionRow';
import { MinimalInsight } from '../../components/minimal/MinimalInsight';
import { MinimalSectionHeader } from '../../components/minimal/MinimalSectionHeader';
import WeeklyReportCard from '../../components/WeeklyReportCard';
import WalletCards from '../../components/WalletCards';
import { PremiumButton, DashboardSkeleton, EmptyState } from '../../components/premium';

const GREETING_TIMES = {
  morning: { time: 5, greeting: 'Good morning' },
  afternoon: { time: 12, greeting: 'Good afternoon' },
  evening: { time: 17, greeting: 'Good evening' },
  night: { time: 21, greeting: 'Good night' },
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= GREETING_TIMES.night.time) return GREETING_TIMES.night.greeting;
  if (hour >= GREETING_TIMES.evening.time) return GREETING_TIMES.evening.greeting;
  if (hour >= GREETING_TIMES.afternoon.time) return GREETING_TIMES.afternoon.greeting;
  if (hour >= GREETING_TIMES.morning.time) return GREETING_TIMES.morning.greeting;
  return GREETING_TIMES.night.greeting;
};

const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    food: 'restaurant',
    transport: 'directions-car',
    shopping: 'shopping-bag',
    entertainment: 'movie',
    health: 'favorite',
    utilities: 'home',
    groceries: 'local-grocery-store',
    default: 'payments',
  };
  return icons[category.toLowerCase()] || icons.default;
};

function MinimalDashboardScreen({ navigation }: any) {
  const { colors, isDark } = useAppTheme();
  const { isAuthenticated, token } = useAuthStore();
  const { summary, isLoading: budgetLoading, fetchBudgetSummary } = useBudgetStore();
  const { expenses, fetchExpenses, deleteExpense } = useExpenseStore();
  const { wallets, fetchWallets } = useWalletStore();
  const { fetchInsights, insights } = useInsightsStore();
  const { alerts, fetchActiveAlerts } = useSmartAlertsStore();
  const { graph: netWorthGraph, fetchGraph } = useNetWorthGraphStore();
  const { report: weeklyReport, isLoading: reportLoading, fetchWeeklyReport } = useWeeklyReportStore();
  const subscriptionStore = useSubscriptionStore();
  const [refreshing, setRefreshing] = useState(false);
  const fade = useSharedValue(0);
  const hasLoaded = useRef(false);

  const animatedContainer = useAnimatedStyle(() => ({
    opacity: fade.value,
  }));

  // Initial load (only once)
  useEffect(() => {
    if (hasLoaded.current) return;
    if (!isAuthenticated || !token) return; // Don't load data until authenticated

    hasLoaded.current = true;

    const loadData = async () => {
      try {
        await Promise.all([
          fetchBudgetSummary(),
          fetchExpenses(),
          fetchWallets(),
          fetchInsights(),
          fetchActiveAlerts(),
          fetchGraph(30),
          fetchWeeklyReport(),
        ]);
      } catch (error) {
        // Silently fail for 403/premium features - they're optional
        // Log for monitoring but don't crash the dashboard
        if (error instanceof Error) {
          // Insights and net-worth graph are optional features
          // Dashboard still works without them
        }
      }
    };

    loadData();
    fade.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
  }, [isAuthenticated, token]);  // Add these dependencies

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchBudgetSummary(),
        fetchExpenses(),
        fetchWallets(),
        fetchInsights(),
        fetchActiveAlerts(),
        fetchGraph(30),
        fetchWeeklyReport(),
      ]);
    } catch (error) {
      // Silently fail for optional features
      // Primary dashboard data (expenses, budgets, wallets) will still load
    } finally {
      setRefreshing(false);
    }
  }, [fetchBudgetSummary, fetchExpenses, fetchWallets, fetchInsights, fetchActiveAlerts, fetchGraph, fetchWeeklyReport]);

  // Get top 5 recent transactions
  const recentTransactions = useMemo(() => {
    return [...expenses]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [expenses]);

  // Get top 3 alerts
  const topAlerts = useMemo(() => {
    return alerts.slice(0, 3);
  }, [alerts]);

  // Get top 2 insights
  const topInsights = useMemo(() => {
    return insights.slice(0, 2);
  }, [insights]);

  // Navigation callbacks (memoized to prevent child re-renders)
  const handleManageWallets = useCallback(() => {
    navigation.navigate('Profile');
  }, [navigation]);

  const handleViewAllAlerts = useCallback(() => {
    navigation.navigate('Notifications');
  }, [navigation]);

  const handleViewMoreInsights = useCallback(() => {
    // Insights screen not yet available - stay on dashboard
  }, [navigation]);

  const handleViewNetWorth = useCallback(() => {
    navigation.navigate('NetWorth');
  }, [navigation]);

  const handleViewAllTransactions = useCallback(() => {
    navigation.getParent()?.navigate('ExpensesTab', { screen: 'ExpenseListRoot' });
  }, [navigation]);

  const handleUpgradeToPremium = useCallback(() => {
    console.log('🎯 Navigating to Subscription screen...');
    navigation.getParent()?.navigate('ProfileTab', { screen: 'Subscription' });
  }, [navigation]);

  const handleAlertPress = useCallback(
    (actionUrl?: string) => {
      if (actionUrl) {
        navigation.navigate(actionUrl.replace('/', ''));
      }
    },
    [navigation]
  );

  if (budgetLoading && !summary) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <DashboardSkeleton colors={colors} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View layout={Layout.springify()} style={[styles.content, animatedContainer]} entering={FadeInDown.duration(350)}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Greeting */}
          <View style={styles.greetingSection}>
            <Text style={[styles.greeting, { color: colors.text }]}>{getGreeting()}</Text>
            <Text style={[styles.greetingMeta, { color: colors.textMuted }]}>
              Track your money with ease
            </Text>
          </View>

          {/* Weekly Report Card */}
          <WeeklyReportCard report={weeklyReport} isLoading={reportLoading} />

          {/* Premium Upgrade Card */}
          {!subscriptionStore.isPremium && (
            <Animated.View
              style={styles.premiumCard}
              entering={FadeInDown.duration(400).delay(200)}
            >
              <TouchableOpacity
                style={[styles.premiumCardContent, { backgroundColor: colors.primary }]}
                onPress={handleUpgradeToPremium}
                activeOpacity={0.85}
              >
                <View style={styles.premiumIconSection}>
                  <MaterialIcons name="star" size={24} color="#fff" />
                </View>
                <View style={styles.premiumTextSection}>
                  <Text style={styles.premiumTitle}>Unlock Premium</Text>
                  <Text style={styles.premiumSubtitle}>
                    Get real-time updates & AI insights
                  </Text>
                </View>
                <MaterialIcons name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Hero Balance */}
          {summary && (
            <>
              <HeroBalance
                balance={Math.max(0, summary.remainingBudget)}
                spent={summary.totalSpending}
                budget={summary.monthlyBudget}
                isDark={isDark}
                colors={colors}
              />

              {/* Progress Bar */}
              <View style={styles.progressSection}>
                <ThinProgressBar
                  percentage={summary.spendingPercentage}
                  colors={colors}
                  isDark={isDark}
                />
              </View>
            </>
          )}

          {/* Wallets Section */}
          {wallets.length > 0 && (
            <View style={styles.section}>
              <MinimalSectionHeader
                title="Wallets"
                colors={colors}
                action={{
                  label: 'Manage',
                  onPress: handleManageWallets,
                }}
              />
              <View style={styles.walletsContainer}>
                <WalletCards />
              </View>
            </View>
          )}

          {/* Smart Alerts Section */}
          {topAlerts.length > 0 && (
            <View style={styles.section}>
              <MinimalSectionHeader
                title="Alerts"
                colors={colors}
                action={{
                  label: 'View all',
                  onPress: handleViewAllAlerts,
                }}
              />
              {topAlerts.map(alert => (
                <MinimalInsight
                  key={alert.id}
                  icon={alert.alertType === 'budget_threshold' ? 'warning' : 'info'}
                  title={alert.title}
                  subtitle={alert.message}
                  severity={alert.severity as any}
                  colors={colors}
                  isDark={isDark}
                  onPress={() => handleAlertPress(alert.actionUrl)}
                />
              ))}
            </View>
          )}

          {/* AI Insights Section */}
          {topInsights.length > 0 && (
            <View style={styles.section}>
              <MinimalSectionHeader
                title="AI Insights"
                colors={colors}
                action={{
                  label: 'More',
                  onPress: handleViewMoreInsights,
                }}
              />
              {topInsights.map((insight, idx) => (
                <MinimalInsight
                  key={idx}
                  icon="lightbulb"
                  title={insight.title}
                  subtitle={insight.description || insight.predictedOutcome}
                  severity={insight.severity as any}
                  colors={colors}
                  isDark={isDark}
                  onPress={handleViewMoreInsights}
                />
              ))}
            </View>
          )}

          {/* Net Worth Summary */}
          {netWorthGraph && (
            <View style={styles.section}>
              <MinimalSectionHeader
                title="Net Worth"
                colors={colors}
                action={{
                  label: 'Details',
                  onPress: handleViewNetWorth,
                }}
              />
              <PressableScale
                onPress={handleViewNetWorth}
                style={[styles.netWorthRow, { borderBottomColor: colors.divider }]}
              >
                <View style={styles.netWorthContent}>
                  <Text style={[styles.netWorthLabel, { color: colors.textMuted }]}>Current total</Text>
                  <Text style={[styles.netWorthAmount, { color: colors.text }]}>
                    ₹{Math.round(netWorthGraph.currentTotal).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.trendBadge}>
                  <MaterialIcons
                    name={netWorthGraph.trend?.direction === 'up' ? 'trending-up' : 'trending-down'}
                    size={16}
                    color={netWorthGraph.trend?.direction === 'up' ? colors.success : colors.danger}
                  />
                  <Text
                    style={[
                      styles.trendText,
                      {
                        color:
                          netWorthGraph.trend?.direction === 'up' ? colors.success : colors.danger,
                      },
                    ]}
                  >
                    {Math.abs(netWorthGraph.trend?.percentChange ?? 0)}%
                  </Text>
                </View>
              </PressableScale>
            </View>
          )}

          {/* Recent Transactions */}
          {recentTransactions.length > 0 && (
            <View style={styles.section}>
              <MinimalSectionHeader
                title="Recent"
                colors={colors}
                action={{
                  label: 'All',
                  onPress: handleViewAllTransactions,
                }}
              />
              <View>
                {recentTransactions.map(expense => (
                  <MinimalTransactionRow
                    key={expense.id}
                    category={expense.category}
                    amount={expense.amount}
                    date={expense.date}
                    icon={getCategoryIcon(expense.category)}
                    colors={colors}
                    isDark={isDark}
                    onPress={handleViewAllTransactions}
                    onDelete={() => deleteExpense(expense.id)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Empty State */}
          {recentTransactions.length === 0 && !budgetLoading && (
            <View style={styles.emptyState}>
              <MaterialIcons name="inbox" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No transactions yet</Text>
              <Text style={[styles.emptySubtext, { color: colors.textDim }]}>
                Start tracking your spending
              </Text>
            </View>
          )}

          {/* Spacer */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

export default memo(MinimalDashboardScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  greetingSection: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    gap: spacing.xs,
  },
  greeting: {
    ...typography.hero,
    fontWeight: '800',
    fontSize: 32,
  },
  greetingMeta: {
    ...typography.small,
    letterSpacing: 0.3,
  },
  progressSection: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  section: {
    marginVertical: spacing.m,
    paddingHorizontal: spacing.m,
  },
  walletsContainer: {
    marginBottom: spacing.s,
  },
  netWorthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
  },
  netWorthContent: {
    gap: spacing.xxs,
  },
  netWorthLabel: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  netWorthAmount: {
    ...typography.title,
    fontWeight: '700',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  trendText: {
    ...typography.small,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.s,
  },
  emptyText: {
    ...typography.body,
    fontWeight: '700',
  },
  emptySubtext: {
    ...typography.small,
  },

  // Premium Card
  premiumCard: {
    marginHorizontal: spacing.m,
    marginVertical: spacing.m,
  },
  premiumCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    borderRadius: 12,
    gap: spacing.m,
  },
  premiumIconSection: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumTextSection: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: spacing.xs,
  },
  premiumSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#fff',
    opacity: 0.9,
  },
});
