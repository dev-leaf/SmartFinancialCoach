import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme, spacing } from '../theme/Theme';
import { httpClient } from '../services/api/httpClient';
import { MobileAnalyticsService } from '../services/analytics/MobileAnalyticsService';

interface SubscriptionTier {
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  recommended?: boolean;
}

const TIERS: SubscriptionTier[] = [
  {
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Basic expense tracking',
    features: [
      'Expense tracking',
      'Budget management',
      'Wallet management',
      'Basic notifications',
    ],
  },
  {
    name: 'Premium',
    price: 99,
    period: 'month',
    description: 'AI coach + net worth graphs',
    features: [
      'Everything in Free',
      'Investment tracking',
      'AI financial insights',
      'Net worth dashboard',
      'Subscription detection',
      'Advanced alerts',
    ],
    recommended: true,
  },
  {
    name: 'Pro',
    price: 299,
    period: 'month',
    description: 'Unlimited alerts + analytics',
    features: [
      'Everything in Premium',
      'Advanced analytics',
      'Custom alerts',
      'Data export',
      'Priority support',
    ],
  },
];

export const PremiumUpgradeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, typography } = useAppTheme();
  const [currentTier, setCurrentTier] = useState('free');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentSubscription();
  }, []);

  const fetchCurrentSubscription = async () => {
    try {
      const response: any = await httpClient.get('/subscription');
      setCurrentTier(response.data?.subscription?.tier || 'free');
    } catch (error) {
      // Silently handle error - default to free tier
      setCurrentTier('free');
    }
  };

  const handleUpgrade = async (tier: string) => {
    if (tier === currentTier) {
      setErrorMessage(`You already have ${tier} tier`);
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    try {
      await MobileAnalyticsService.trackEvent('upgrade_clicked', { tier });
      const response = await httpClient.post('/subscription/upgrade', { tier });
      setCurrentTier(tier);
      await MobileAnalyticsService.trackEvent('upgrade_success', { tier });
      // Success - close modal or show inline confirmation
      setErrorMessage(null);
    } catch (error) {
      await MobileAnalyticsService.trackEvent('upgrade_failed', { tier });
      setErrorMessage('Failed to upgrade subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    setErrorMessage(null);
    try {
      await httpClient.post('/subscription/cancel');
      setCurrentTier('free');
      setErrorMessage('Successfully downgraded to free tier');
      // Auto-clear success message after 2s
      setTimeout(() => setErrorMessage(null), 2000);
    } catch (error) {
      setErrorMessage('Failed to cancel subscription. Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Error/Success Message Banner */}
      {errorMessage && (
        <View
          style={[
            styles.messageBanner,
            {
              backgroundColor:
                errorMessage.includes('success') || errorMessage.includes('Successfully')
                  ? colors.success + '20'
                  : colors.danger + '20',
              borderBottomColor:
                errorMessage.includes('success') || errorMessage.includes('Successfully')
                  ? colors.success
                  : colors.danger,
            },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              {
                color:
                  errorMessage.includes('success') || errorMessage.includes('Successfully')
                    ? colors.success
                    : colors.danger,
              },
            ]}
          >
            {errorMessage}
          </Text>
        </View>
      )}
      <ScrollView
        scrollEventThrottle={16}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            SmartFinancialCoach
          </Text>
          <Text style={[styles.subtitle, { color: colors.textDim }]}>
            Upgrade for better decisions, less overspending, and faster savings.
          </Text>
        </View>

        {/* Value props (high-conversion) */}
        <View style={[styles.valueRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.valueItem}>
            <Text style={[styles.valueBig, { color: colors.text }]}>Save ₹2000/mo</Text>
            <Text style={[styles.valueSmall, { color: colors.textDim }]}>Find subscriptions + cut waste</Text>
          </View>
          <View style={[styles.valueDivider, { backgroundColor: colors.border }]} />
          <View style={styles.valueItem}>
            <Text style={[styles.valueBig, { color: colors.text }]}>Avoid overspending</Text>
            <Text style={[styles.valueSmall, { color: colors.textDim }]}>AI warnings + budget pacing</Text>
          </View>
        </View>

        {/* Pricing Cards */}
        <View style={styles.cardsContainer}>
          {TIERS.map(tier => (
            <View
              key={tier.name}
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor:
                    tier.recommended && currentTier === 'free'
                      ? colors.primary
                      : colors.border,
                  borderWidth: tier.recommended ? 2 : 1,
                },
              ]}
            >
              {tier.recommended && currentTier === 'free' && (
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: '#fff' }]}>
                    MOST POPULAR
                  </Text>
                </View>
              )}

              {currentTier === tier.name.toLowerCase() && (
                <View style={styles.currentBadge}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color={colors.primary}
                  />
                  <Text
                    style={[
                      styles.currentText,
                      { color: colors.primary },
                    ]}
                  >
                    Current Plan
                  </Text>
                </View>
              )}

              <Text style={[styles.tierName, { color: colors.text }]}>
                {tier.name}
              </Text>

              <View style={styles.priceContainer}>
                <Text style={[styles.price, { color: colors.text }]}>
                  ₹{tier.price}
                </Text>
                <Text
                  style={[styles.period, { color: colors.textDim }]}
                >
                  /{tier.period}
                </Text>
              </View>

              <Text
                style={[
                  styles.description,
                  { color: colors.textDim },
                ]}
              >
                {tier.description}
              </Text>

              {tier.name !== 'Free' && (
                <View style={[styles.trialPill, { borderColor: colors.border }]}>
                  <MaterialCommunityIcons name="rocket-launch" size={16} color={colors.primary} />
                  <Text style={[styles.trialText, { color: colors.text }]}>Start 7-day free trial</Text>
                </View>
              )}

              {/* Features List */}
              <View style={styles.features}>
                {tier.features.map((feature, idx) => (
                  <View key={idx} style={styles.featureItem}>
                    <MaterialCommunityIcons
                      name="check"
                      size={18}
                      color={colors.primary}
                    />
                    <Text
                      style={[
                        styles.featureText,
                        { color: colors.textDim },
                      ]}
                    >
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Button */}
              {currentTier !== tier.name.toLowerCase() ? (
                <TouchableOpacity
                  style={[
                    styles.button,
                    {
                      backgroundColor: tier.recommended
                        ? colors.primary
                        : colors.surface,
                      borderColor: tier.recommended
                        ? 'transparent'
                        : colors.border,
                      borderWidth: 1,
                    },
                  ]}
                  onPress={() =>
                    handleUpgrade(tier.name.toLowerCase())
                  }
                  disabled={isLoading}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      {
                        color: tier.recommended
                          ? '#fff'
                          : colors.text,
                      },
                    ]}
                  >
                    {isLoading ? 'Processing...' : 'Upgrade'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View
                  style={[
                    styles.button,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      { color: colors.textDim },
                    ]}
                  >
                    Current Plan
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={[styles.faqTitle, { color: colors.text }]}>
            Questions?
          </Text>

          <TouchableOpacity
            style={styles.faqItem}
            onPress={() => setExpandedFAQ(expandedFAQ === 0 ? null : 0)}
            activeOpacity={0.7}
          >
            <Text style={[styles.faqQuestion, { color: colors.text }]}>
              Can I cancel anytime?
            </Text>
            <MaterialCommunityIcons
              name={expandedFAQ === 0 ? 'chevron-down' : 'chevron-right'}
              size={20}
              color={colors.textDim}
            />
          </TouchableOpacity>
          {expandedFAQ === 0 && (
            <Text style={[styles.faqAnswer, { color: colors.textMuted }]}>
              Yes, you can cancel your subscription anytime with no penalties. Your access continues until the end of your billing period.
            </Text>
          )}

          <TouchableOpacity
            style={styles.faqItem}
            onPress={() => setExpandedFAQ(expandedFAQ === 1 ? null : 1)}
            activeOpacity={0.7}
          >
            <Text style={[styles.faqQuestion, { color: colors.text }]}>
              Do you offer refunds?
            </Text>
            <MaterialCommunityIcons
              name={expandedFAQ === 1 ? 'chevron-down' : 'chevron-right'}
              size={20}
              color={colors.textDim}
            />
          </TouchableOpacity>
          {expandedFAQ === 1 && (
            <Text style={[styles.faqAnswer, { color: colors.textMuted }]}>
              We offer a 7-day money-back guarantee on all subscriptions. Contact support for refund requests.
            </Text>
          )}

          <TouchableOpacity
            style={styles.faqItem}
            onPress={() => setExpandedFAQ(expandedFAQ === 2 ? null : 2)}
            activeOpacity={0.7}
          >
            <Text style={[styles.faqQuestion, { color: colors.text }]}>
              What payment methods do you accept?
            </Text>
            <MaterialCommunityIcons
              name={expandedFAQ === 2 ? 'chevron-down' : 'chevron-right'}
              size={20}
              color={colors.textDim}
            />
          </TouchableOpacity>
          {expandedFAQ === 2 && (
            <Text style={[styles.faqAnswer, { color: colors.textMuted }]}>
              We accept all major credit/debit cards, UPI, and digital wallets through our secure payment processor.
            </Text>
          )}
        </View>

        {/* Cancel Subscription (if applicable) */}
        {currentTier !== 'free' && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
          >
            <Text
              style={[
                styles.cancelText,
                { color: colors.primary },
              ]}
            >
              Downgrade to Free
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.m,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: spacing.xxs,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  cardsContainer: {
    gap: spacing.m,
    marginBottom: spacing.xl,
  },
  valueRow: {
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.s,
  },
  valueItem: { flex: 1 },
  valueBig: { fontSize: 14, fontWeight: '900' },
  valueSmall: { fontSize: 12, fontWeight: '600', marginTop: 6 },
  valueDivider: { width: 1, height: 44, marginHorizontal: spacing.xs },
  card: {
    borderRadius: 16,
    padding: spacing.l,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -12,
    right: spacing.m,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  trialPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.s,
  },
  trialText: {
    fontSize: 12,
    fontWeight: '800',
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.xxs,
  },
  currentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tierName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.xs,
  },
  price: {
    fontSize: 32,
    fontWeight: '700',
  },
  period: {
    fontSize: 14,
    marginLeft: 4,
  },
  description: {
    fontSize: 13,
    marginBottom: spacing.m,
  },
  features: {
    gap: spacing.s,
    marginBottom: spacing.l,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  featureText: {
    fontSize: 13,
    flex: 1,
  },
  button: {
    paddingVertical: spacing.s,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  faqSection: {
    marginBottom: spacing.l,
  },
  faqTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.s,
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  faqAnswer: {
    fontSize: 13,
    lineHeight: 20,
    paddingHorizontal: 0,
    paddingVertical: spacing.s,
    marginBottom: spacing.s,
  },
  messageBanner: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderBottomWidth: 2,
  },
  messageText: {
    fontSize: 13,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: spacing.s,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
