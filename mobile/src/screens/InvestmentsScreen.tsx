import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  FadeInDown,
  ZoomIn,
} from 'react-native-reanimated';
import { useInvestmentStore } from '../store/investmentStore';
import { useAppTheme } from '../theme/Theme';
import { spacing } from '../theme/Theme';
import { Investment, PortfolioSummary } from '../types/investment';
import { AddInvestmentModal } from '../components/investments/AddInvestmentModal';
import { usePricePolling } from '../hooks/usePricePolling';
import { AnimatedPriceChange } from '../components/investments/AnimatedPriceChange';
import { Sparkline } from '../components/investments/Sparkline';

const fmt = (n: number, digits = 2) =>
  n.toLocaleString('en-IN', { maximumFractionDigits: digits });

// Optimized Animated Counter - No runOnJS loops
const AnimatedCounter = ({ value = 0, style, color }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withTiming(1.05, { duration: 100 });
    scale.value = withTiming(1, { duration: 100 });
  }, [value]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.Text style={[style, { color }, animStyle]}>
      ₹{fmt(Math.floor(value), 0)}
    </Animated.Text>
  );
};

// Error State UI
const ErrorState = ({ error, errorType, colors, onRetry }) => {
  let title = 'Something went wrong';
  let description = error || 'Unable to load investments';
  let icon = 'alert-circle';

  if (errorType === 'network') {
    title = 'No Internet Connection';
    description = 'Please check your internet and try again';
    icon = 'wifi-off';
  } else if (errorType === 'empty') {
    title = 'Unable to Load Data';
    description = 'The server returned empty data. Please try again.';
    icon = 'inbox-multiple';
  }

  return (
    <Animated.View
      style={styles.errorContainer}
      entering={FadeInDown.duration(400)}
    >
      <MaterialCommunityIcons
        name={icon}
        size={64}
        color={colors.danger}
        style={{ marginBottom: spacing.l, opacity: 0.7 }}
      />
      <Text style={[styles.errorTitle, { color: colors.text }]}>
        {title}
      </Text>
      <Text style={[styles.errorDesc, { color: colors.textSecondary }]}>
        {description}
      </Text>
      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: colors.primary }]}
        onPress={onRetry}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="refresh" size={18} color="#fff" />
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Sparkle Animation
const Sparkle = ({ colors }) => {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    opacity.value = withTiming(0, {
      duration: 1200,
      easing: Easing.out(Easing.quad),
    });
    scale.value = withTiming(2, {
      duration: 1200,
      easing: Easing.out(Easing.quad),
    });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.sparkle, animStyle]}>
      <MaterialCommunityIcons name="sparkles" size={16} color={colors.success} />
    </Animated.View>
  );
};

// Portfolio Hero
const PortfolioHero = ({ portfolio, colors }) => {
  if (!portfolio) return null;

  const isProfit = portfolio.totalProfitLoss >= 0;
  const profitColor = isProfit ? colors.success : colors.danger;

  return (
    <Animated.View
      style={styles.heroSection}
      entering={FadeInDown.duration(500).delay(100)}
    >
      <View style={styles.heroContent}>
        <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>
          Total Investment
        </Text>
        <AnimatedCounter
          value={portfolio.totalCurrentValue}
          digits={0}
          style={styles.heroValue}
          color={colors.text}
        />
      </View>

      <View style={[styles.heroDivider, { backgroundColor: colors.border }]} />

      <View style={styles.heroContent}>
        <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>
          Profit/Loss
        </Text>
        <View style={styles.profitRow}>
          <Animated.View style={styles.profitContent} entering={ZoomIn.delay(300)}>
            <AnimatedCounter
              value={Math.abs(portfolio.totalProfitLoss)}
              digits={0}
              style={styles.profitValue}
              color={profitColor}
            />
            <Text style={[styles.profitPercent, { color: profitColor }]}>
              {isProfit ? '+' : ''}{portfolio.totalProfitLossPercent.toFixed(2)}%
              {isProfit ? ' ↑' : ' ↓'}
            </Text>
          </Animated.View>

          {isProfit && portfolio.totalProfitLossPercent > 15 && (
            <Sparkle colors={colors} />
          )}
        </View>
      </View>
    </Animated.View>
  );
};

// Investment Row
const InvestmentRow = React.memo(
  ({ investment, colors, index, onLongPress, priceHistory }) => {
    const isProfit = investment.profitLoss >= 0;
    const profitColor = isProfit ? colors.success : colors.danger;
    const scale = useSharedValue(1);
    const prevPrice = priceHistory?.[0] || investment.currentPrice;

    const handlePressIn = async () => {
      scale.value = withTiming(0.97, { duration: 100 });
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handlePressOut = () => {
      scale.value = withTiming(1, { duration: 100 });
    };

    const animStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    return (
      <Animated.View
        style={[animStyle, { marginBottom: spacing.xs }]}
        entering={FadeInDown.delay(index * 50)}
      >
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onLongPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onLongPress?.(investment);
          }}
          delayLongPress={500}
        >
          <View
            style={[
              styles.investmentRow,
              {
                backgroundColor: colors.surface,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <View style={styles.assetInfo}>
              <Text style={[styles.assetName, { color: colors.text }]}>
                {investment.assetName}
              </Text>
              <Text style={[styles.assetType, { color: colors.textSecondary }]}>
                {investment.type === 'stock'
                  ? 'Stock'
                  : investment.type === 'crypto'
                  ? 'Crypto'
                  : investment.type === 'mutual_fund'
                  ? 'Mutual Fund'
                  : 'Other'}
              </Text>
              {/* Sparkline below asset type */}
              {priceHistory && priceHistory.length > 1 && (
                <View style={styles.sparklineContainer}>
                  <Sparkline data={priceHistory} colors={colors} />
                </View>
              )}
            </View>

            <View style={styles.assetValue}>
              <AnimatedPriceChange
                price={investment.currentPrice}
                previousPrice={prevPrice}
                style={styles.currentValue}
                colors={colors}
              />
              <View style={styles.profitDisplay}>
                <Text style={[styles.profitText, { color: profitColor }]}>
                  {isProfit ? '+' : ''}₹{fmt(investment.profitLoss, 0)}
                </Text>
                <Text style={[styles.profitPercent, { color: profitColor }]}>
                  {isProfit ? ' ↑' : ' ↓'}
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }
);

InvestmentRow.displayName = 'InvestmentRow';

// Empty State
const EmptyState = ({ colors, onAddPress }) => {
  return (
    <Animated.View
      style={styles.emptyContainer}
      entering={FadeInDown.duration(600).delay(200)}
    >
      <MaterialCommunityIcons
        name="chart-line"
        size={80}
        color={colors.primary}
        style={{ opacity: 0.8, marginBottom: spacing.l }}
      />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        Start Investing Today
      </Text>
      <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
        Track stocks, crypto & more in one place
      </Text>
      <TouchableOpacity
        style={[styles.emptyButton, { backgroundColor: colors.primary }]}
        onPress={onAddPress}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="plus" size={20} color="#fff" />
        <Text style={styles.emptyButtonText}>Add Investment</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Skeleton Loader
const SkeletonLoader = ({ colors }) => {
  return (
    <View>
      <View style={[styles.skeletonHero, { backgroundColor: colors.surface }]} />
      {[1, 2, 3].map((i) => (
        <Animated.View
          key={i}
          style={[styles.skeletonRow, { backgroundColor: colors.surface }]}
          entering={FadeInDown.delay(i * 100)}
        />
      ))}
    </View>
  );
};

// FAB Menu
const FABMenu = ({ colors, onAddStock, onAddCrypto, onAddFund, onAddPress }) => {
  const [expanded, setExpanded] = useState(false);
  const rotation = useSharedValue(0);

  const toggleExpand = () => {
    setExpanded(!expanded);
    rotation.value = withTiming(expanded ? 0 : 45, { duration: 300 });
  };

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.fabContainer}>
      {expanded && (
        <>
          <Animated.View
            style={[
              styles.fabMenuItem,
              { backgroundColor: colors.primary, bottom: 80 },
            ]}
            entering={FadeInDown.duration(200)}
          >
            <TouchableOpacity
              style={styles.fabMenuButton}
              onPress={() => {
                onAddPress();
                setExpanded(false);
              }}
            >
              <MaterialCommunityIcons name="trending-up" size={20} color="#fff" />
              <Text style={styles.fabMenuText}>Stock</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            style={[
              styles.fabMenuItem,
              { backgroundColor: colors.primary, bottom: 140 },
            ]}
            entering={FadeInDown.duration(200).delay(50)}
          >
            <TouchableOpacity
              style={styles.fabMenuButton}
              onPress={() => {
                onAddPress();
                setExpanded(false);
              }}
            >
              <MaterialCommunityIcons name="bitcoin" size={20} color="#fff" />
              <Text style={styles.fabMenuText}>Crypto</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            style={[
              styles.fabMenuItem,
              { backgroundColor: colors.primary, bottom: 200 },
            ]}
            entering={FadeInDown.duration(200).delay(100)}
          >
            <TouchableOpacity
              style={styles.fabMenuButton}
              onPress={() => {
                onAddPress();
                setExpanded(false);
              }}
            >
              <MaterialCommunityIcons name="chart-pie" size={20} color="#fff" />
              <Text style={styles.fabMenuText}>Mutual Fund</Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}

      <Animated.View
        style={[styles.fab, { backgroundColor: colors.primary }, rotateStyle]}
      >
        <TouchableOpacity
          style={styles.fabButton}
          onPress={toggleExpand}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="plus" size={28} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// Main Screen - Production Ready
export const InvestmentsScreen = ({ navigation }) => {
  const { colors } = useAppTheme();
  const {
    investments,
    portfolioSummary,
    isLoadingInitial,
    isRefreshing,
    isSubmitting,
    error,
    errorType,
    lastUpdated,
    priceHistory,
    fetchInvestments,
    fetchPortfolioSummary,
    cachedInvestments,
    cachedPortfolio,
    clearError,
  } = useInvestmentStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const listRefreshTimeoutRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true);

  // Enable real-time price polling when screen is focused
  const { isPolling } = usePricePolling(investments.length > 0);

  // Use useFocusEffect to load data when screen is focused (prevents duplicate API calls on navigation)
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      isMountedRef.current = true;

      const loadInitialData = async () => {
        try {
          await Promise.all([fetchInvestments(), fetchPortfolioSummary()]);
        } catch (err) {
          if (mounted) {
            console.error('Load error:', err);
          }
        }
      };

      loadInitialData();

      // Setup periodic refresh every 60 seconds while focused
      const refreshInterval = setInterval(() => {
        if (mounted && isMountedRef.current) {
          loadInitialData().catch(console.error);
        }
      }, 60000);

      return () => {
        mounted = false;
        isMountedRef.current = false;
        clearInterval(refreshInterval);
      };
    }, [fetchInvestments, fetchPortfolioSummary])
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (listRefreshTimeoutRef.current) {
        clearTimeout(listRefreshTimeoutRef.current);
      }
      isMountedRef.current = false;
    };
  }, []);

  const onRefresh = useCallback(async () => {
    try {
      await Promise.all([fetchInvestments(), fetchPortfolioSummary()]);
    } catch (err) {
      console.error('Refresh error:', err);
    }
  }, [fetchInvestments, fetchPortfolioSummary]);

  const handleRetry = useCallback(() => {
    clearError();
    onRefresh();
  }, [clearError, onRefresh]);

  const handleRowLongPress = (item: Investment) => {
    console.log('Long press on investment:', item.assetName);
    // TODO: Implement edit/delete menu in future
  };

  // Use cached data as fallback when network error occurs
  const displayInvestments = Array.isArray(investments) ? investments : [];
  const displayPortfolio = portfolioSummary || cachedPortfolio || null;
  const hasData = displayInvestments.length > 0;

  const getTimeAgo = () => {
    if (!lastUpdated) return 'Never';
    const now = new Date();
    const diff = now.getTime() - lastUpdated.getTime();
    const secs = Math.floor(diff / 1000);
    const mins = Math.floor(secs / 60);
    if (mins === 0) return 'Just now';
    if (mins === 1) return '1 min ago';
    if (mins < 60) return `${mins} mins ago`;
    return 'A while ago';
  };

  const renderItem = ({ item, index }: { item: Investment; index: number }) => (
    <InvestmentRow
      investment={item}
      colors={colors}
      index={index}
      onLongPress={handleRowLongPress}
      priceHistory={priceHistory[item.id] || []}
    />
  );

  // Render appropriate empty/error/loading state
  const renderListContent = () => {
    // Error state takes priority
    if (error && !hasData) {
      return {
        ListEmptyComponent: (
          <ErrorState
            error={error}
            errorType={errorType}
            colors={colors}
            onRetry={handleRetry}
          />
        ),
      };
    }

    // Loading initial data
    if (isLoadingInitial && !hasData) {
      return {
        ListEmptyComponent: <SkeletonLoader colors={colors} />,
      };
    }

    // Empty state (no investments and not loading)
    if (!hasData && !isLoadingInitial) {
      return {
        ListEmptyComponent: (
          <EmptyState colors={colors} onAddPress={() => setShowAddModal(true)} />
        ),
      };
    }

    return { ListEmptyComponent: undefined };
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Animated.View
        style={[styles.header, { borderBottomColor: colors.border }]}
        entering={FadeInDown.duration(400)}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Your Investments
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Updated {getTimeAgo()}
            </Text>
          </View>
          {isPolling && (
            <View style={styles.liveIndicator}>
              <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.liveText, { color: colors.success }]}>Live</Text>
            </View>
          )}
        </View>
      </Animated.View>

      <FlatList
        data={displayInvestments}
        renderItem={renderItem}
        keyExtractor={(item) => item.id || Math.random().toString()}
        {...renderListContent()}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingHorizontal: spacing.l, paddingTop: spacing.m },
        ]}
        ListHeaderComponent={
          hasData && displayPortfolio ? (
            <PortfolioHero portfolio={displayPortfolio} colors={colors} />
          ) : null
        }
        scrollEventThrottle={16}
        // Performance optimizations
        initialNumToRender={6}
        windowSize={5}
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
      />

      {hasData && !isSubmitting && (
        <FABMenu
          colors={colors}
          onAddStock={() => setShowAddModal(true)}
          onAddCrypto={() => setShowAddModal(true)}
          onAddFund={() => setShowAddModal(true)}
          onAddPress={() => setShowAddModal(true)}
        />
      )}

      {/* Add Investment Modal */}
      <AddInvestmentModal
        isVisible={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.l, paddingVertical: spacing.m, borderBottomWidth: 1 },
  headerTitle: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, fontWeight: '400', marginTop: spacing.xs },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  listContent: { flexGrow: 1, paddingBottom: spacing.xl },
  
  // Error State Styles
  errorContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: spacing.l },
  errorTitle: { fontSize: 22, fontWeight: '700', marginBottom: spacing.s, textAlign: 'center' },
  errorDesc: { fontSize: 14, fontWeight: '400', marginBottom: spacing.l, textAlign: 'center', maxWidth: '90%' },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderRadius: 8,
    gap: spacing.s,
  },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  
  heroSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxl,
    paddingVertical: spacing.l,
  },
  heroContent: { flex: 1 },
  heroLabel: { fontSize: 12, fontWeight: '500', marginBottom: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  heroValue: { fontSize: 32, fontWeight: '700', letterSpacing: -0.5 },
  heroDivider: { width: 1, height: 50, marginHorizontal: spacing.m },
  profitRow: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
  profitContent: { flexDirection: 'row', alignItems: 'center' },
  profitValue: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  profitPercent: { fontSize: 14, fontWeight: '600', marginLeft: spacing.xs },
  sparkle: { position: 'absolute', left: 120, top: -10 },
  investmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.m,
    borderRadius: 12,
    borderBottomWidth: 1,
  },
  assetInfo: { flex: 1 },
  assetName: { fontSize: 16, fontWeight: '600', marginBottom: spacing.xs },
  assetType: { fontSize: 13, fontWeight: '400' },
  sparklineContainer: { marginTop: spacing.xs },
  assetValue: { alignItems: 'flex-end' },
  currentValue: { fontSize: 16, fontWeight: '600', marginBottom: spacing.xs },
  profitDisplay: { flexDirection: 'row', alignItems: 'center' },
  profitText: { fontSize: 13, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 100 },
  emptyTitle: { fontSize: 24, fontWeight: '700', marginBottom: spacing.s, textAlign: 'center' },
  emptyDesc: { fontSize: 14, fontWeight: '400', marginBottom: spacing.l, textAlign: 'center', maxWidth: '85%' },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderRadius: 8,
    gap: spacing.s,
  },
  emptyButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  skeletonHero: { height: 100, borderRadius: 8, marginBottom: spacing.xxl },
  skeletonRow: { height: 70, borderRadius: 12, marginBottom: spacing.m },
  fabContainer: { position: 'absolute', bottom: 20, right: 20 },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  fabButton: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  fabMenuItem: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  fabMenuButton: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  fabMenuText: { color: '#fff', fontSize: 10, fontWeight: '600', marginTop: 4 },
});

export default InvestmentsScreen;
