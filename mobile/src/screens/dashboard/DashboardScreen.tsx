import React, { useEffect, useMemo, useState, useRef, memo } from 'react';
import { View, StyleSheet, Text, ScrollView, useWindowDimensions, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  interpolateColor,
  FadeInDown,
} from 'react-native-reanimated';
import { useBudgetStore, useExpenseStore, useWalletStore } from '../../store';
import { useHealthScoreStore } from '../../store/healthScoreStore';
import { useInsightsStore } from '../../store/insightsStore';
import { useNetWorthGraphStore } from '../../store/netWorthGraphStore';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import CategoryPieChart from '../../components/charts/CategoryPieChart';
import SpendingTrendChart from '../../components/charts/SpendingTrendChart';
import { HealthScoreCard } from '../../components/HealthScoreCard';
import { InsightCard, InsightsList } from '../../components/InsightCard';
import { LockedFeatureOverlay } from '../../components/paywall/LockedFeatureOverlay';
import { formatCurrency } from '../../utils/formatting';
import { generateInsightsFromMetrics } from '../../utils/insights';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSmsSync } from '../../hooks/useSmsSync';
import { useAppTheme } from '../../theme/Theme';
import AnimatedNumber from '../../components/AnimatedNumber';
import WalletCards from '../../components/WalletCards';
import PressableScale from '../../components/PressableScale';
import { notificationService } from '../../services/notifications/notificationService';
import { Expense } from '../../types/expense';

export default memo(function DashboardScreen({ navigation }: any) {
  const { summary, isLoading: budgetLoading, fetchBudgetSummary } = useBudgetStore();
  const { expenses, categoryTotals, dailySpending, expenseMetrics, fetchExpenses, deleteExpense } =
    useExpenseStore();
  const { fetchWallets, wallets } = useWalletStore();
  const { healthScore, isLoading: healthScoreLoading, fetchHealthScore } = useHealthScoreStore();
  const { insights, isLoading: insightsLoading, fetchInsights } = useInsightsStore();
  const { graph: netWorthGraph, fetchGraph } = useNetWorthGraphStore();
  const { subscription, fetchSubscription } = useSubscriptionStore();
  const { syncedCount } = useSmsSync();
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const { colors, isDark, typography } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const hasLoaded = useRef(false);

  const progress = useSharedValue(0);
  const fade = useSharedValue(0);
  const deletedExpenseRef = useRef<Expense | null>(null);

  // Responsive values
  const isSmallScreen = width < 375;
  const isMediumScreen = width < 768;

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    const loadData = async () => {
      try {
        await Promise.all([
          fetchBudgetSummary(),
          fetchExpenses(),
          fetchWallets(),
          fetchHealthScore(),
          fetchInsights(),
          fetchGraph(30),
          fetchSubscription(),
        ]);
      } catch (error) {
        // Silently handle errors - optional features may fail
      }
    };

    loadData();
    fade.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
  }, []);

  useEffect(() => {
    if (syncedCount > 0) {
      setSnackbarMessage(`✨ Added ${syncedCount} expense(s) from SMS`);
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
    }
  }, [syncedCount]);

  useEffect(() => {
    if (summary) {
      const percentage = Math.max(0, Math.min(100, summary.spendingPercentage)) / 100;
      progress.value = withDelay(withTiming(percentage, { duration: 1100, easing: Easing.out(Easing.cubic) }), 100);
      notificationService.scheduleBudgetAlert(summary).catch(() => undefined);
    }
  }, [progress, summary]);

  const animatedContainer = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ translateY: (1 - fade.value) * 16 }],
  }));

  const smartInsights = useMemo(() => generateInsightsFromMetrics(expenseMetrics, summary), [expenseMetrics, summary]);

  const animatedProgressStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 0.5, 0.8, 1],
      [colors.success, colors.warning, colors.danger, colors.danger]
    );

    return {
      width: `${progress.value * 100}%`,
      backgroundColor,
    };
  });

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const expenseToDel = expenses.find(e => e.id === expenseId);
      if (expenseToDel) deletedExpenseRef.current = expenseToDel;
      await deleteExpense(expenseId);
      setSnackbarMessage('Expense deleted');
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 2000);
    } catch (error) {
      // Silently handle error - user can retry
    }
  };

  if (budgetLoading && !summary) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <View style={styles.skeletonHeader} />
        <View style={styles.skeletonCard} />
        <View style={styles.skeletonSmallRow} />
        <View style={styles.skeletonSmallRow} />
      </SafeAreaView>
    );
  }

  const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const recentExpenses = sortedExpenses.slice(0, 8);

  const bgColor = colors.background;
  const textColor = colors.text;
  const secondaryText = colors.textDim;
  const borderColor = colors.border;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: bgColor }]}
      edges={['top', 'left', 'right']}
    >
      <Animated.View style={[styles.content, animatedContainer]} entering={FadeInDown.duration(350)}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: spacing.xxl + 80, // Account for tab bar
          }}
          scrollEventThrottle={16}
        >
          {/* HEADER */}
          <View style={[styles.header, { paddingHorizontal: spacing.md }]}>
            <Text style={[styles.greeting, { color: textColor }]} numberOfLines={1}>
              Good afternoon
            </Text>
            <Text
              style={[styles.subtitle, { color: secondaryText }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              A premium overview of your cash, budgets and smart insights.
            </Text>
          </View>

          {/* HERO CARD */}
          {summary && (
            <View style={[styles.heroCard, { backgroundColor: isDark ? '#121214' : '#FFF', borderColor }]}>
              <View style={styles.heroTop}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.heroLabel, { color: secondaryText }]} numberOfLines={1}>
                    Available Balance
                  </Text>
                  <Text
                    style={[styles.heroSubtext, { color: secondaryText }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {formatCurrency(summary.totalSpending)} spent · {formatCurrency(summary.monthlyBudget)} target
                  </Text>
                </View>
                <MaterialIcons name="signal-cellular-alt" size={24} color={colors.primary} style={{ marginLeft: spacing.md }} />
              </View>

              <View style={styles.balanceContainer}>
                <Text style={[styles.currency, { color: textColor }]}>₹</Text>
                <AnimatedNumber value={Math.max(0, summary.remainingBudget)} style={[styles.heroAmount, { color: textColor }]} />
              </View>

              <View style={[styles.progressSection, { backgroundColor: isDark ? '#18181A' : '#F3F6FF' }]}>
                <View style={[styles.progressTrack, { backgroundColor: isDark ? '#29292C' : '#E5E7EB' }]}>
                  <Animated.View style={[styles.progressFill, animatedProgressStyle]} />
                </View>
                <Text style={[styles.progressLabel, { color: secondaryText }]} numberOfLines={1}>
                  {Math.round(summary.spendingPercentage)}% of monthly budget
                </Text>
              </View>
            </View>
          )}

          {/* WALLETS */}
          {wallets.length > 0 && (
            <View style={styles.section}>
              <View style={[styles.sectionHeader, { paddingHorizontal: spacing.md }]}>
                <Text style={[styles.sectionTitle, { color: textColor }]} numberOfLines={1}>
                  Your Wallets
                </Text>
                <PressableScale
                  onPress={() => navigation.getParent()?.navigate('ProfileTab')}
                  hitSlop={spacing.sm}
                >
                  <Text style={[styles.sectionAction, { color: colors.primary }]}>Manage</Text>
                </PressableScale>
              </View>
              <WalletCards />
            </View>
          )}

          {/* NET WORTH */}
          <View style={styles.section}>
            <View style={[styles.sectionHeader, { paddingHorizontal: spacing.md }]}>
              <Text style={[styles.sectionTitle, { color: textColor }]} numberOfLines={1}>
                Net Worth
              </Text>
              <PressableScale
                onPress={() => navigation.navigate('NetWorth')}
                hitSlop={spacing.sm}
              >
                <Text style={[styles.sectionAction, { color: colors.primary }]}>Details</Text>
              </PressableScale>
            </View>
            <View style={[styles.card, { backgroundColor: isDark ? '#121214' : '#FFF', borderColor }]}>
              <Text style={[styles.cardLabel, { color: secondaryText }]} numberOfLines={1}>
                Current total
              </Text>
              <Text style={[styles.cardValue, { color: textColor }]} numberOfLines={1} ellipsizeMode="tail">
                ₹{Math.round(netWorthGraph?.currentTotal ?? 0).toLocaleString('en-IN')}
              </Text>
              <Text style={[styles.cardSubtext, { color: secondaryText }]} numberOfLines={1} ellipsizeMode="tail">
                {netWorthGraph?.trend?.direction ?? 'stable'} · {Math.round(netWorthGraph?.trend?.percentChange ?? 0)}%
                {' '}· 30 days
              </Text>
              {subscription?.features && !subscription.features.netWorth && (
                <LockedFeatureOverlay
                  title="Net Worth Graph is Premium"
                  subtitle="Unlock 30/90-day trends and track progress automatically."
                  onPress={() => navigation.navigate('Upgrade')}
                />
              )}
            </View>
          </View>

          {/* HEALTH SCORE */}
          <View style={styles.section}>
            <View style={[styles.sectionHeader, { paddingHorizontal: spacing.md }]}>
              <Text style={[styles.sectionTitle, { color: textColor }]} numberOfLines={1}>
                Financial Health
              </Text>
              <PressableScale
                onPress={() => navigation.getParent()?.navigate('HealthTab')}
                hitSlop={spacing.sm}
              >
                <Text style={[styles.sectionAction, { color: colors.primary }]}>Details</Text>
              </PressableScale>
            </View>
            <View style={{ paddingHorizontal: spacing.md }}>
              <HealthScoreCard
                healthScore={healthScore}
                isLoading={healthScoreLoading}
                style={{}}
              />
            </View>
          </View>

          {/* AI INSIGHTS */}
          <View style={styles.section}>
            <View style={[styles.sectionHeader, { paddingHorizontal: spacing.md }]}>
              <Text style={[styles.sectionTitle, { color: textColor }]} numberOfLines={1}>
                AI Coach
              </Text>
              <PressableScale
                onPress={() => navigation.getParent()?.navigate('CoachTab')}
                hitSlop={spacing.sm}
              >
                <Text style={[styles.sectionAction, { color: colors.primary }]}>More</Text>
              </PressableScale>
            </View>
            <View style={{ paddingHorizontal: spacing.md }}>
              {insights.length > 0 ? (
                <InsightCard
                  insight={insights[0]}
                  onPress={() => navigation.getParent()?.navigate('CoachTab')}
                />
              ) : (
                <View style={[styles.card, { backgroundColor: isDark ? '#121214' : '#FFF', borderColor }]}>
                  <Text style={[styles.cardLabel, { color: secondaryText }]}>AI Insights</Text>
                  <Text style={[styles.cardSubtext, { color: secondaryText }]}>
                    Your coach insights will appear here once generated.
                  </Text>
                </View>
              )}
              {subscription?.features && !subscription.features.aiInsights && (
                <LockedFeatureOverlay
                  title="AI Insights are Premium"
                  subtitle="Unlock warnings, suggestions, and predictions tailored to your spending."
                  onPress={() => navigation.navigate('Upgrade')}
                />
              )}
            </View>
          </View>

          {/* SMART INSIGHTS */}
          <View style={[styles.section, { paddingHorizontal: spacing.md }]}>
            {smartInsights.warnings.map((warning, index) => (
              <View
                key={`warn-${index}`}
                style={[
                  styles.insightRow,
                  { backgroundColor: isDark ? 'rgba(255, 59, 48, 0.08)' : 'rgba(255, 59, 48, 0.06)' },
                ]}
              >
                <MaterialIcons name="warning" size={18} color={colors.danger} style={{ marginRight: spacing.md, flexShrink: 0 }} />
                <Text style={[styles.insightText, { color: textColor }]} numberOfLines={3} ellipsizeMode="tail">
                  {warning}
                </Text>
              </View>
            ))}
            {smartInsights.insights.map((insight, index) => (
              <View
                key={`ins-${index}`}
                style={[
                  styles.insightRow,
                  { backgroundColor: isDark ? 'rgba(52, 199, 89, 0.08)' : 'rgba(52, 199, 89, 0.06)' },
                ]}
              >
                <MaterialIcons name="lightbulb" size={18} color={colors.success} style={{ marginRight: spacing.md, flexShrink: 0 }} />
                <Text style={[styles.insightText, { color: textColor }]} numberOfLines={3} ellipsizeMode="tail">
                  {insight}
                </Text>
              </View>
            ))}
            {smartInsights.predictions.map((prediction, index) => (
              <View
                key={`pred-${index}`}
                style={[
                  styles.insightRow,
                  { backgroundColor: isDark ? 'rgba(10, 132, 255, 0.08)' : 'rgba(10, 132, 255, 0.06)' },
                ]}
              >
                <MaterialIcons name="trending-up" size={18} color={colors.primary} style={{ marginRight: spacing.md, flexShrink: 0 }} />
                <Text style={[styles.insightText, { color: textColor }]} numberOfLines={3} ellipsizeMode="tail">
                  {prediction}
                </Text>
              </View>
            ))}
          </View>

          {/* CHARTS */}
          {categoryTotals.length > 0 && (
            <View style={[styles.section, { paddingHorizontal: spacing.md }]}>
              <CategoryPieChart data={categoryTotals} />
            </View>
          )}

          {dailySpending.length > 0 && (
            <View style={[styles.section, { paddingHorizontal: spacing.md }]}>
              <SpendingTrendChart data={dailySpending} />
            </View>
          )}

          {/* RECENT TRANSACTIONS */}
          <View style={[styles.section, { paddingHorizontal: spacing.md }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: textColor }]} numberOfLines={1}>
                Recent Transactions
              </Text>
              {recentExpenses.length > 0 && (
                <PressableScale
                  onPress={() => navigation.getParent()?.navigate('ExpensesTab', { screen: 'ExpenseListRoot' })}
                  hitSlop={spacing.sm}
                >
                  <Text style={[styles.sectionAction, { color: colors.primary }]}>See all</Text>
                </PressableScale>
              )}
            </View>

            {recentExpenses.length > 0 ? (
              <View style={[styles.transactionList, { borderColor }]}>
                {recentExpenses.map((expense, index) => (
                  <PressableScale
                    key={expense.id}
                    onPress={() => handleDeleteExpense(expense.id)}
                    style={[
                      styles.transactionRow,
                      {
                        borderBottomColor: borderColor,
                        borderBottomWidth: index < recentExpenses.length - 1 ? 1 : 0,
                      },
                    ]}
                  >
                    <View style={[styles.transactionIcon, { backgroundColor: isDark ? '#18181A' : '#F3F5FF' }]}>
                      <MaterialIcons name="shopping-bag" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={[styles.transactionCategory, { color: textColor }]} numberOfLines={1} ellipsizeMode="tail">
                        {expense.category}
                      </Text>
                      <Text style={[styles.transactionDate, { color: secondaryText }]} numberOfLines={1}>
                        {new Date(expense.date).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={[styles.transactionAmount, { color: colors.danger }]} numberOfLines={1}>
                      -₹{expense.amount}
                    </Text>
                  </PressableScale>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="receipt" size={40} color={secondaryText} />
                <Text style={[styles.emptyText, { color: secondaryText }]}>No transactions yet</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </Animated.View>

      {/* SNACKBAR */}
      {showSnackbar && (
        <View style={[styles.snackbar, { backgroundColor: isDark ? '#212124' : '#000' }]}>
          <Text style={[styles.snackbarText, { color: '#FFF' }]} numberOfLines={2} ellipsizeMode="tail">
            {snackbarMessage}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
});

// ════════════════════════════════════════════════════════════════════════════════
// SPACING SYSTEM (Consistent spacing hierarchy)
// ════════════════════════════════════════════════════════════════════════════════
const spacing = {
  xs: 4,   // Minimal spacing
  sm: 8,   // Small gaps
  md: 16,  // Standard padding
  lg: 24,  // Large sections
  xl: 32,  // Extra large gaps
  xxl: 40, // Extra extra large
} as const;

// ════════════════════════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  // ─────────────────────────────────────────────────────────────────────────────
  // LAYOUT & CONTAINERS
  // ─────────────────────────────────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  content: {
    flex: 1,
  },

  section: {
    marginBottom: spacing.lg,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // HEADER
  // ─────────────────────────────────────────────────────────────────────────────
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },

  greeting: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 40,
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    letterSpacing: 0.2,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // HERO CARD (Available Balance)
  // ─────────────────────────────────────────────────────────────────────────────
  heroCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },

  heroLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },

  heroSubtext: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 20,
    maxWidth: '85%',
  },

  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.xl,
  },

  currency: {
    fontSize: 32,
    fontWeight: '700',
    marginRight: spacing.sm,
    lineHeight: 40,
  },

  heroAmount: {
    fontSize: 42,
    fontWeight: '800',
    lineHeight: 50,
    letterSpacing: -0.5,
  },

  progressSection: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
  },

  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },

  progressFill: {
    height: '100%',
    borderRadius: 999,
  },

  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION HEADERS
  // ─────────────────────────────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    flex: 1,
  },

  sectionAction: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CARDS (Generic, reusable card styling)
  // ─────────────────────────────────────────────────────────────────────────────
  card: {
    marginHorizontal: spacing.md,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: Platform.OS === 'ios' ? 0.05 : 0.03,
    shadowRadius: 4,
    elevation: 2,
  },

  cardLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  cardValue: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: spacing.md,
    lineHeight: 36,
    letterSpacing: -0.5,
  },

  cardSubtext: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: spacing.sm,
    lineHeight: 18,
  },

  // Legacy card names (for backward compatibility)
  walletSection: {
    marginBottom: spacing.lg,
    marginHorizontal: spacing.md,
  },

  netWorthSection: {
    marginBottom: spacing.lg,
  },

  netWorthCard: {
    marginHorizontal: spacing.md,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },

  netWorthLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  netWorthValue: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: spacing.md,
    lineHeight: 36,
  },

  netWorthSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: spacing.sm,
    lineHeight: 18,
  },

  healthScoreSection: {
    marginBottom: spacing.lg,
  },

  aiInsightsSection: {
    marginBottom: spacing.lg,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // INSIGHTS (Warning, Insight, Prediction rows)
  // ─────────────────────────────────────────────────────────────────────────────
  insightsSection: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },

  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 18,
  },

  insightText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: 0.2,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CHARTS
  // ─────────────────────────────────────────────────────────────────────────────
  chartSection: {
    marginBottom: spacing.md,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // TRANSACTIONS
  // ─────────────────────────────────────────────────────────────────────────────
  transactionList: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: Platform.OS === 'ios' ? 0.05 : 0.03,
    shadowRadius: 4,
    elevation: 2,
  },

  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },

  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    flexShrink: 0,
  },

  transactionInfo: {
    flex: 1,
    minWidth: 0, // Prevents text overflow in row
  },

  transactionCategory: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: spacing.xs,
    letterSpacing: -0.2,
  },

  transactionDate: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },

  transactionAmount: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginLeft: spacing.md,
    flexShrink: 0,
  },

  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // EMPTY STATE
  // ─────────────────────────────────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },

  emptyText: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: spacing.md,
    lineHeight: 22,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SNACKBAR (Bottom notification)
  // ─────────────────────────────────────────────────────────────────────────────
  snackbar: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.md,
    right: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: Platform.OS === 'ios' ? 0.3 : 0.2,
    shadowRadius: 12,
    elevation: 8,
  },

  snackbarText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SKELETON (Loading state)
  // ─────────────────────────────────────────────────────────────────────────────
  skeletonHeader: {
    height: 28,
    width: '60%',
    marginTop: spacing.xl,
    marginHorizontal: spacing.md,
    borderRadius: 14,
    backgroundColor: '#E8E8E8',
  },

  skeletonCard: {
    height: 220,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: 24,
    backgroundColor: '#E8E8E8',
  },

  skeletonSmallRow: {
    height: 16,
    width: '90%',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: 12,
    backgroundColor: '#E8E8E8',
  },
});
