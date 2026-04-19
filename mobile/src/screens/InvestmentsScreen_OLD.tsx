import React, { useEffect, useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useInvestmentStore } from '../store/investmentStore';
import { useAppTheme } from '../theme/Theme';
import { Investment, CreateInvestmentPayload, PortfolioSummary } from '../types/investment';
import { LinearGradient } from 'expo-linear-gradient';

// ─── Helper ───────────────────────────────────────────────────────────────────

const fmt = (n: number, digits = 0) =>
  n.toLocaleString('en-IN', { maximumFractionDigits: digits });

const fmtTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

// ─── Sub-components ────────────────────────────────────────────────────────────

interface ChangeBadgeProps {
  value: number;  // % change
  size?: 'sm' | 'md';
}
const ChangeBadge = memo(({ value, size = 'md' }: ChangeBadgeProps) => {
  const positive = value >= 0;
  const color     = positive ? '#10b981' : '#ef4444';
  const bg        = positive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)';
  const icon      = positive ? 'trending-up' : 'trending-down';
  const fontSize  = size === 'sm' ? 11 : 13;

  return (
    <View style={[styles.changeBadge, { backgroundColor: bg }]}>
      <MaterialCommunityIcons name={icon} size={fontSize + 2} color={color} />
      <Text style={[styles.changeBadgeText, { color, fontSize }]}>
        {positive ? '+' : ''}{value.toFixed(2)}%
      </Text>
    </View>
  );
});
ChangeBadge.displayName = 'ChangeBadge';

// ── Portfolio hero card ────────────────────────────────────────────────────────

interface PortfolioCardProps {
  summary: PortfolioSummary;
  lastUpdated: Date | null;
  usingCache: boolean;
  colors: any;
}
const PortfolioCard = memo(({ summary, lastUpdated, usingCache, colors }: PortfolioCardProps) => {
  const isPositive = summary.totalProfitLoss >= 0;
  const pnlColor   = isPositive ? '#10b981' : '#ef4444';

  return (
    <Animated.View entering={FadeInDown.delay(50).springify()}>
      <LinearGradient
        colors={isPositive
          ? ['#0d3026', '#0f4a38', '#0d3026']
          : ['#2d1515', '#4a1f1f', '#2d1515']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.portfolioCard}
      >
        {/* Header row */}
        <View style={styles.portfolioCardHeader}>
          <Text style={styles.portfolioLabel}>Total Portfolio Value</Text>
          <View style={styles.cardHeaderRight}>
            {usingCache && (
              <View style={styles.cacheBadge}>
                <MaterialCommunityIcons name="wifi-off" size={11} color="#f59e0b" />
                <Text style={styles.cacheBadgeText}>Cached</Text>
              </View>
            )}
            {lastUpdated && (
              <Text style={styles.lastUpdatedText}>
                Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
          </View>
        </View>

        {/* Total value */}
        <Text style={styles.portfolioValue}>
          ₹{fmt(summary.totalCurrentValue)}
        </Text>

        {/* P&L row */}
        <View style={styles.pnlRow}>
          <View>
            <Text style={styles.portfolioSubLabel}>Total P&L</Text>
            <Text style={[styles.pnlValue, { color: pnlColor }]}>
              {isPositive ? '+' : ''}₹{fmt(summary.totalProfitLoss)}
            </Text>
          </View>
          <View style={styles.pnlRight}>
            <Text style={styles.portfolioSubLabel}>Return</Text>
            <ChangeBadge value={summary.totalProfitLossPercent} size="md" />
          </View>
          <View style={styles.pnlRight}>
            <Text style={styles.portfolioSubLabel}>Invested</Text>
            <Text style={styles.investedValue}>₹{fmt(summary.totalInvested)}</Text>
          </View>
        </View>

        {/* Performers */}
        {(summary.topPerformer || summary.worstPerformer) && (
          <View style={styles.performersRow}>
            {summary.topPerformer && (
              <View style={styles.performerChip}>
                <MaterialCommunityIcons name="trophy" size={12} color="#10b981" />
                <Text style={[styles.performerText, { color: '#10b981' }]}>
                  {summary.topPerformer.assetSymbol ?? summary.topPerformer.assetName}
                  {' +'}
                  {summary.topPerformer.profitLossPercent.toFixed(1)}%
                </Text>
              </View>
            )}
            {summary.worstPerformer && (
              <View style={styles.performerChip}>
                <MaterialCommunityIcons name="arrow-down-circle" size={12} color="#ef4444" />
                <Text style={[styles.performerText, { color: '#ef4444' }]}>
                  {summary.worstPerformer.assetSymbol ?? summary.worstPerformer.assetName}
                  {' '}
                  {summary.worstPerformer.profitLossPercent.toFixed(1)}%
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Type breakdown pills */}
        {summary.byType && Object.keys(summary.byType).length > 0 && (
          <View style={styles.typePills}>
            {Object.entries(summary.byType).map(([type, d]) => (
              <View key={type} style={styles.typePill}>
                <Text style={styles.typePillLabel}>{type}</Text>
                <Text style={styles.typePillValue}>₹{fmt(d.totalCurrentValue)}</Text>
              </View>
            ))}
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
});
PortfolioCard.displayName = 'PortfolioCard';

// ── Individual investment card ─────────────────────────────────────────────────

interface InvestmentCardProps {
  investment: Investment;
  colors: any;
  index: number;
}
const InvestmentCard = memo(({ investment, colors, index }: InvestmentCardProps) => {
  const isPositive = investment.profitLossPercent >= 0;
  const pnlColor   = isPositive ? '#10b981' : '#ef4444';

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
      <View style={[styles.investmentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Row 1: name + 24h change */}
        <View style={styles.cardRow1}>
          <View style={[styles.assetIconContainer, { backgroundColor: isPositive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }]}>
            <Text style={[styles.assetIconText, { color: pnlColor }]}>
              {(investment.assetSymbol ?? investment.assetName).slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={styles.cardNameBlock}>
            <Text style={[styles.assetName, { color: colors.text }]} numberOfLines={1}>
              {investment.assetName}
            </Text>
            <Text style={[styles.assetSymbol, { color: colors.textSecondary }]}>
              {investment.assetSymbol ?? '—'} · {investment.type}
              {investment.usingCachedPrice ? ' · ⚠ Cached' : ''}
            </Text>
          </View>
          <ChangeBadge value={investment.change24h} size="sm" />
        </View>

        {/* Row 2: price + qty */}
        <View style={styles.cardRow2}>
          <View style={styles.cardMetric}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Buy Price</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>₹{fmt(investment.buyPrice, 2)}</Text>
          </View>
          <View style={styles.cardMetric}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Live Price</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>₹{fmt(investment.currentPrice, 2)}</Text>
          </View>
          <View style={styles.cardMetric}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Qty</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{investment.quantity}</Text>
          </View>
        </View>

        {/* Row 3: current value + P&L */}
        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Current Value</Text>
            <Text style={[styles.footerValue, { color: colors.text }]}>₹{fmt(investment.totalCurrentValue)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>P&L</Text>
            <Text style={[styles.footerValue, { color: pnlColor }]}>
              {isPositive ? '+' : ''}₹{fmt(Math.abs(investment.profitLoss))}
              {'  '}
              <Text style={{ fontSize: 12 }}>
                ({isPositive ? '+' : ''}{investment.profitLossPercent.toFixed(2)}%)
              </Text>
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
});
InvestmentCard.displayName = 'InvestmentCard';

// ── Skeleton loader ───────────────────────────────────────────────────────────

const SkeletonCard = memo(({ colors }: { colors: any }) => {
  const opacity = useSharedValue(0.4);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: 800 });
  }, [opacity]);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={[styles.skeletonCard, { backgroundColor: colors.card }, animStyle]}>
      <View style={[styles.skeletonRow, { backgroundColor: colors.border, width: '60%' }]} />
      <View style={[styles.skeletonRow, { backgroundColor: colors.border, width: '40%', marginTop: 8 }]} />
      <View style={[styles.skeletonRow, { backgroundColor: colors.border, width: '80%', marginTop: 16 }]} />
    </Animated.View>
  );
});
SkeletonCard.displayName = 'SkeletonCard';

const SkeletonPortfolio = memo(({ colors }: { colors: any }) => (
  <View style={[styles.skeletonPortfolio, { backgroundColor: colors.card }]}>
    <View style={[styles.skeletonRow, { backgroundColor: colors.border, width: '50%' }]} />
    <View style={[styles.skeletonRowLg, { backgroundColor: colors.border, marginTop: 12 }]} />
    <View style={[styles.skeletonRow, { backgroundColor: colors.border, width: '70%', marginTop: 12 }]} />
  </View>
));
SkeletonPortfolio.displayName = 'SkeletonPortfolio';

// ── Add investment modal ───────────────────────────────────────────────────────

interface AddModalProps {
  visible: boolean;
  formData: Partial<CreateInvestmentPayload>;
  onChange: (d: Partial<CreateInvestmentPayload>) => void;
  onAdd: () => void;
  onCancel: () => void;
  isLoading: boolean;
  colors: any;
}
const AddInvestmentModal = memo(({ visible, formData, onChange, onAdd, onCancel, isLoading, colors }: AddModalProps) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
    <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
      <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Add Investment</Text>
          <TouchableOpacity onPress={onCancel}>
            <MaterialCommunityIcons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalForm} keyboardShouldPersistTaps="handled">
          {[
            { label: 'Asset Name', key: 'assetName', placeholder: 'e.g. Apple Inc', type: 'default' },
            { label: 'Symbol', key: 'assetSymbol', placeholder: 'e.g. AAPL or BTC', type: 'default' },
            { label: 'Type (stock / crypto)', key: 'type', placeholder: 'stock', type: 'default' },
            { label: 'Quantity', key: 'quantity', placeholder: '0', type: 'decimal-pad' },
            { label: 'Buy Price (₹)', key: 'buyPrice', placeholder: '0.00', type: 'decimal-pad' },
          ].map(({ label, key, placeholder, type }) => (
            <View key={key} style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
              <TextInput
                style={[styles.fieldInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={key === 'quantity' || key === 'buyPrice'
                  ? (formData[key as keyof CreateInvestmentPayload]?.toString() ?? '')
                  : ((formData[key as keyof CreateInvestmentPayload] as string) ?? '')}
                onChangeText={v => {
                  if (key === 'quantity') onChange({ ...formData, quantity: parseFloat(v) || 0 });
                  else if (key === 'buyPrice') onChange({ ...formData, buyPrice: parseFloat(v) || 0 });
                  else onChange({ ...formData, [key]: v });
                }}
                placeholder={placeholder}
                placeholderTextColor={colors.textSecondary}
                keyboardType={type as any}
                autoCapitalize="none"
              />
            </View>
          ))}
          <Text style={[styles.hintText, { color: colors.textSecondary }]}>
            💡 Tip: Use BTC, ETH, SOL for crypto; AAPL, TSLA for stocks. Live prices will be fetched automatically.
          </Text>
        </ScrollView>

        <View style={[styles.modalButtons, { borderTopColor: colors.border }]}>
          <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.surface }]} onPress={onCancel} disabled={isLoading}>
            <Text style={[styles.modalBtnText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={onAdd} disabled={isLoading}>
            <Text style={[styles.modalBtnText, { color: '#fff' }]}>{isLoading ? 'Adding…' : 'Add'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
));
AddInvestmentModal.displayName = 'AddInvestmentModal';

// ── Main screen ───────────────────────────────────────────────────────────────

export const InvestmentsScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const store = useInvestmentStore();

  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateInvestmentPayload>>({
    assetName: '', assetSymbol: '', type: 'stock', quantity: 0, buyPrice: 0, currency: 'INR',
  });

  useEffect(() => { 
    console.log('🔄 InvestmentsScreen mounted, loading data...');
    loadData(); 
  }, []);

  // Debug effect to log store changes
  useEffect(() => {
    console.log('📊 STORE UPDATE:', {
      portfolioSummary: store.portfolioSummary,
      investments: store.investments,
      investmentsCount: store.investments.length,
      isLoading: store.isLoading,
      error: store.error,
    });
  }, [store.portfolioSummary, store.investments, store.isLoading]);

  const loadData = async () => {
    try {
      await Promise.all([store.fetchInvestments(), store.fetchPortfolioSummary()]);
    } catch (_) {}
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await store.refreshPortfolio(); } finally { setRefreshing(false); }
  }, [store]);

  const handleAdd = async () => {
    if (!formData.assetName || !formData.quantity || !formData.buyPrice) {
      return Alert.alert('Missing fields', 'Asset name, quantity and buy price are required.');
    }
    try {
      await store.createInvestment(formData as CreateInvestmentPayload);
      setModalVisible(false);
      setFormData({ assetName: '', assetSymbol: '', type: 'stock', quantity: 0, buyPrice: 0, currency: 'INR' });
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to create investment');
    }
  };

  // Detect if any investment is using cached data
  const anyCached = store.investments.some(i => i.usingCachedPrice);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Fixed header */}
      <Animated.View entering={FadeIn.duration(300)} style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Investments</Text>
          {store.lastUpdated && (
            <Text style={[styles.subTitle, { color: colors.textDim }]}>
              Updated {fmtTime(store.lastUpdated.toISOString())}
              {anyCached ? ' · ⚠ Some prices cached' : ''}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="plus" size={22} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Portfolio Summary Card */}
        {store.isLoading && !store.portfolioSummary ? (
          <SkeletonPortfolio colors={colors} />
        ) : store.portfolioSummary ? (
          <View style={styles.section}>
            <PortfolioCard
              summary={store.portfolioSummary}
              lastUpdated={store.lastUpdated}
              usingCache={anyCached}
              colors={colors}
            />
          </View>
        ) : null}

        {/* Investment list */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textDim }]}>
            Your Holdings
          </Text>

          {(() => {
            console.log('🎨 RENDER CHECK: isLoading=', store.isLoading, 'count=', store.investments.length);

            // Show loading
            if (store.isLoading && store.investments.length === 0) {
              return (
                <>
                  <SkeletonCard colors={colors} />
                  <SkeletonCard colors={colors} />
                  <SkeletonCard colors={colors} />
                </>
              );
            }

            // Show empty state
            if (!store.isLoading && store.investments.length === 0) {
              return (
                <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
                  <MaterialCommunityIcons name="briefcase-outline" size={48} color={colors.textDim} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No Investments Yet</Text>
                  <Text style={[styles.emptyDesc, { color: colors.textDim }]}>
                    Tap + to add your first stock or crypto holding
                  </Text>
                  <TouchableOpacity
                    style={[styles.emptyAddButton, { backgroundColor: colors.primary }]}
                    onPress={() => setModalVisible(true)}
                  >
                    <Text style={styles.emptyAddButtonText}>Add Investment</Text>
                  </TouchableOpacity>
                </View>
              );
            }

            // Show list
            if (store.investments.length > 0) {
              return store.investments.map((item, index) => {
                console.log(`🎨 Rendering investment ${index}: ${item.assetName}`);
                return <InvestmentCard key={item.id} investment={item} colors={colors} index={index} />;
              });
            }

            // Fallback
            return <Text style={{ color: colors.text }}>No data</Text>;
          })()}
        </View>
      </ScrollView>

      <AddInvestmentModal
        visible={modalVisible}
        formData={formData}
        onChange={setFormData}
        onAdd={handleAdd}
        onCancel={() => setModalVisible(false)}
        isLoading={store.isLoading}
        colors={colors}
      />
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  subTitle: { fontSize: 12, marginTop: 3 },

  addButton: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },

  scrollContent: { paddingBottom: 120 },

  section: { padding: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '600', letterSpacing: 0.5, marginBottom: 12 },

  // ── Portfolio card ──
  portfolioCard: {
    borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  portfolioCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
  },
  portfolioLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500' },
  cardHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lastUpdatedText: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },

  cacheBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(245,158,11,0.2)',
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6,
  },
  cacheBadgeText: { color: '#f59e0b', fontSize: 10, fontWeight: '600' },

  portfolioValue: {
    color: '#fff', fontSize: 34, fontWeight: '800', letterSpacing: -1, marginBottom: 16,
  },
  pnlRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16,
  },
  pnlRight: { alignItems: 'flex-end' },
  portfolioSubLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 11, marginBottom: 4 },
  pnlValue: { fontSize: 18, fontWeight: '700' },
  investedValue: { color: 'rgba(255,255,255,0.8)', fontSize: 15, fontWeight: '600' },

  performersRow: {
    flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap',
  },
  performerChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  performerText: { fontSize: 12, fontWeight: '600' },

  typePills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typePill: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6,
  },
  typePillLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '500' },
  typePillValue: { color: '#fff', fontSize: 12, fontWeight: '700', marginTop: 2 },

  // ── Change badge ──
  changeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
  },
  changeBadgeText: { fontWeight: '700' },

  // ── Investment card ──
  investmentCard: {
    borderRadius: 16, marginBottom: 12, borderWidth: 1, overflow: 'hidden',
  },
  cardRow1: {
    flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12,
  },
  assetIconContainer: {
    width: 44, height: 44, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  assetIconText: { fontSize: 16, fontWeight: '800' },
  cardNameBlock: { flex: 1 },
  assetName: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  assetSymbol: { fontSize: 12, fontWeight: '500' },

  cardRow2: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: 12, paddingHorizontal: 16,
  },
  cardMetric: { alignItems: 'center' },
  metricLabel: { fontSize: 11, fontWeight: '500', marginBottom: 4 },
  metricValue: { fontSize: 13, fontWeight: '700' },

  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between',
    padding: 16, borderTopWidth: 1,
  },
  footerValue: { fontSize: 15, fontWeight: '700' },

  // ── Skeleton ──
  skeletonPortfolio: {
    borderRadius: 20, padding: 20, margin: 16,
    height: 160,
  },
  skeletonCard: {
    borderRadius: 16, padding: 16, marginBottom: 12, height: 110,
  },
  skeletonRow: { height: 14, borderRadius: 7, width: '100%' },
  skeletonRowLg: { height: 28, borderRadius: 10, width: '100%' },

  // ── Empty state ──
  emptyState: {
    borderRadius: 20, padding: 32, alignItems: 'center',
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  emptyAddButton: {
    marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12,
  },
  emptyAddButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // ── Modal ──
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalForm: { padding: 20 },
  formField: { marginBottom: 18 },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8, letterSpacing: 0.3 },
  fieldInput: {
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
  },
  hintText: { fontSize: 12, lineHeight: 18, marginTop: 8 },
  modalButtons: {
    flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1,
  },
  modalBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
  },
  modalBtnText: { fontSize: 15, fontWeight: '700' },
});
