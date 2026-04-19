import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeIn,
  SlideInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../../theme/Theme';
import { spacing } from '../../theme/Theme';
import { useInvestmentStore } from '../../store/investmentStore';
import { CreateInvestmentPayload } from '../../types/investment';
import { AssetSearchList } from './AssetSearchList';

// Mock asset database - replace with real API
const MOCK_ASSETS = [
  { name: 'Apple Inc.', symbol: 'AAPL', type: 'stock' as const, currentPrice: 185.50 },
  { name: 'Microsoft Corporation', symbol: 'MSFT', type: 'stock' as const, currentPrice: 380.25 },
  { name: 'Tesla Inc.', symbol: 'TSLA', type: 'stock' as const, currentPrice: 242.80 },
  { name: 'Reliance Industries', symbol: 'RELIANCE', type: 'stock' as const, currentPrice: 2840.50 },
  { name: 'TCS', symbol: 'TCS', type: 'stock' as const, currentPrice: 3580.75 },
  { name: 'Bitcoin', symbol: 'BTC', type: 'crypto' as const, currentPrice: 5234000 },
  { name: 'Ethereum', symbol: 'ETH', type: 'crypto' as const, currentPrice: 340000 },
  { name: 'Solana', symbol: 'SOL', type: 'crypto' as const, currentPrice: 185000 },
  { name: 'SBI Bluechip Fund', symbol: 'SBIBF', type: 'mutual_fund' as const, currentPrice: 450.25 },
  { name: 'HDFC Growth Fund', symbol: 'HDFC-GF', type: 'mutual_fund' as const, currentPrice: 680.80 },
];

interface SelectedAsset {
  name: string;
  symbol: string;
  type: 'stock' | 'crypto' | 'mutual_fund' | 'commodity';
  currentPrice: number;
}

interface AddInvestmentModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const fmt = (n: number, digits = 2) =>
  n.toLocaleString('en-IN', { maximumFractionDigits: digits });

export const AddInvestmentModal: React.FC<AddInvestmentModalProps> = ({
  isVisible,
  onClose,
}) => {
  const { colors } = useAppTheme();
  const { createInvestment } = useInvestmentStore();

  const [step, setStep] = useState<'search' | 'form'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<SelectedAsset | null>(null);
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slideY = useSharedValue(500);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
  }));

  // Animate in/out
  React.useEffect(() => {
    if (isVisible) {
      slideY.value = withTiming(0, { duration: 300 });
    } else {
      slideY.value = withTiming(500, { duration: 300 });
    }
  }, [isVisible]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return MOCK_ASSETS.filter(
      asset =>
        asset.name.toLowerCase().includes(query) ||
        asset.symbol.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  const handleSelectAsset = (asset: SelectedAsset) => {
    setSelectedAsset(asset);
    setBuyPrice(asset.currentPrice.toString());
    setSearchQuery('');
    setStep('form');
    // Focus quantity input
    setTimeout(() => {
      // Auto-focus would go here if we had a ref
    }, 100);
  };

  const handleGoBack = () => {
    if (step === 'form') {
      setStep('search');
      setError(null);
    } else {
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!selectedAsset || !quantity || !buyPrice) {
      setError('Please fill all fields');
      return;
    }

    const quantityNum = parseFloat(quantity);
    const buyPriceNum = parseFloat(buyPrice);

    if (quantityNum <= 0 || buyPriceNum <= 0) {
      setError('Quantity and price must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: CreateInvestmentPayload = {
        assetName: selectedAsset.name,
        assetSymbol: selectedAsset.symbol,
        type: selectedAsset.type,
        quantity: quantityNum,
        buyPrice: buyPriceNum,
        currency: 'INR',
        purchaseDate: new Date().toISOString().split('T')[0],
      };

      await createInvestment(payload);

      // Success haptic
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );

      // Reset and close
      setQuantity('');
      setBuyPrice('');
      setSelectedAsset(null);
      setSearchQuery('');
      setStep('search');

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add investment');
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  const totalInvestment = quantity && buyPrice
    ? (parseFloat(quantity) * parseFloat(buyPrice))
    : 0;

  return (
    <Animated.View style={[styles.container, { entering: FadeIn }]}>
      <BlurView intensity={90} style={styles.blur} tint="dark">
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => {
            Keyboard.dismiss();
            onClose();
          }}
        />
      </BlurView>

      <Animated.View
        style={[
          styles.modal,
          { backgroundColor: colors.background },
          animStyle,
        ]}
        entering={SlideInDown.duration(300)}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={28}
              color={colors.primary}
            />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {step === 'search' ? 'Add Investment' : selectedAsset?.name}
          </Text>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons
              name="close"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          keyboardShouldPersistTaps="handled"
        >
          {step === 'search' ? (
            <>
              {/* Search Input */}
              <View
                style={[
                  styles.searchInputContainer,
                  { backgroundColor: colors.surface },
                ]}
              >
                <MaterialCommunityIcons
                  name="magnify"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search stock, crypto, fund..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="done"
                />
                {searchQuery ? (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialCommunityIcons
                      name="close-circle"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Results */}
              {searchResults.length > 0 ? (
                <AssetSearchList
                  assets={searchResults}
                  onSelect={handleSelectAsset}
                  colors={colors}
                />
              ) : (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons
                    name="magnify"
                    size={40}
                    color={colors.textSecondary}
                    style={{ opacity: 0.5 }}
                  />
                  <Text
                    style={[
                      styles.emptyStateText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {searchQuery
                      ? 'No results found'
                      : 'Search BTC, AAPL, or RELIANCE'}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <>
              {/* Asset Info */}
              {selectedAsset && (
                <>
                  <View style={styles.assetInfoCard}>
                    <View style={styles.assetInfoLeft}>
                      <Text
                        style={[
                          styles.assetSymbol,
                          { color: colors.primary },
                        ]}
                      >
                        {selectedAsset.symbol}
                      </Text>
                      <Text style={[styles.assetType, { color: colors.textSecondary }]}>
                        {selectedAsset.type === 'stock'
                          ? 'Stock'
                          : selectedAsset.type === 'crypto'
                          ? 'Crypto'
                          : 'Mutual Fund'}
                      </Text>
                    </View>
                    <View style={styles.assetInfoRight}>
                      <Text style={[styles.assetPrice, { color: colors.text }]}>
                        ₹{fmt(selectedAsset.currentPrice, 2)}
                      </Text>
                      <Text
                        style={[styles.assetPriceLabel, { color: colors.textSecondary }]}
                      >
                        Live Price
                      </Text>
                    </View>
                  </View>

                  {/* Quantity Input */}
                  <View style={styles.inputGroup}>
                    <Text
                      style={[styles.inputLabel, { color: colors.text }]}
                    >
                      Quantity
                    </Text>
                    <View
                      style={[
                        styles.inputField,
                        { borderColor: colors.border, backgroundColor: colors.surface },
                      ]}
                    >
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="0.00"
                        placeholderTextColor={colors.textSecondary}
                        value={quantity}
                        onChangeText={setQuantity}
                        keyboardType="decimal-pad"
                        returnKeyType="next"
                      />
                    </View>
                  </View>

                  {/* Buy Price Input */}
                  <View style={styles.inputGroup}>
                    <Text
                      style={[styles.inputLabel, { color: colors.text }]}
                    >
                      Buy Price (per unit)
                    </Text>
                    <View
                      style={[
                        styles.inputField,
                        { borderColor: colors.border, backgroundColor: colors.surface },
                      ]}
                    >
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="0.00"
                        placeholderTextColor={colors.textSecondary}
                        value={buyPrice}
                        onChangeText={setBuyPrice}
                        keyboardType="decimal-pad"
                        returnKeyType="done"
                      />
                    </View>
                  </View>

                  {/* Total */}
                  {totalInvestment > 0 && (
                    <View
                      style={[
                        styles.totalCard,
                        { backgroundColor: colors.surface },
                      ]}
                    >
                      <Text
                        style={[styles.totalLabel, { color: colors.textSecondary }]}
                      >
                        Total Investment
                      </Text>
                      <Text
                        style={[styles.totalValue, { color: colors.primary }]}
                      >
                        ₹{fmt(totalInvestment, 0)}
                      </Text>
                    </View>
                  )}

                  {/* Error */}
                  {error && (
                    <View
                      style={[
                        styles.errorBanner,
                        { backgroundColor: colors.danger + '20' },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="alert-circle"
                        size={16}
                        color={colors.danger}
                      />
                      <Text
                        style={[
                          styles.errorText,
                          { color: colors.danger },
                        ]}
                      >
                        {error}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </>
          )}
        </ScrollView>

        {/* Submit Button (only on form step) */}
        {step === 'form' && (
          <View
            style={[
              styles.footer,
              { borderTopColor: colors.border },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: colors.primary,
                  opacity: isSubmitting || !quantity || !buyPrice ? 0.6 : 1,
                },
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || !quantity || !buyPrice}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Add Investment</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '80%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing.xs,
  },
  closeButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    paddingBottom: spacing.xxl,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    borderRadius: 12,
    marginBottom: spacing.l,
    height: 48,
  },
  searchIcon: {
    marginRight: spacing.m,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    padding: 0,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: spacing.m,
    textAlign: 'center',
  },
  assetInfoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.m,
    marginBottom: spacing.l,
    borderRadius: 12,
  },
  assetInfoLeft: {
    justifyContent: 'center',
  },
  assetSymbol: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  assetType: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  assetInfoRight: {
    alignItems: 'flex-end',
  },
  assetPrice: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  assetPriceLabel: {
    fontSize: 12,
    fontWeight: '400',
  },
  inputGroup: {
    marginBottom: spacing.l,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.s,
  },
  inputField: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.m,
    height: 48,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    fontWeight: '500',
  },
  totalCard: {
    padding: spacing.m,
    borderRadius: 12,
    marginBottom: spacing.l,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    borderRadius: 8,
    marginBottom: spacing.l,
    gap: spacing.s,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  footer: {
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderTopWidth: 1,
  },
  submitButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
