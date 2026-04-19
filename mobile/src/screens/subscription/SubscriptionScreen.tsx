import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Animated, {
  FadeInDown,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../../theme/Theme';
import { spacing } from '../../theme/Theme';
import { useSubscriptionStore } from '../../store/subscriptionStore';

interface Plan {
  id: string;
  name: string;
  tier: 'free' | 'premium' | 'pro';
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
  cta: string;
}

const MOCK_PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    tier: 'free',
    price: '₹0',
    period: 'Forever',
    description: 'Basic investment tracking',
    features: [
      'Track investments',
      'Basic portfolio',
      'Monthly reports',
      'Manual price updates',
    ],
    cta: 'Current Plan',
  },
  {
    id: 'premium',
    name: 'Pro Monthly',
    tier: 'premium',
    price: '₹299',
    period: '/month',
    description: 'Advanced features included',
    features: [
      'All Free features',
      'Real-time prices (<10s)',
      'Advanced analytics',
      'AI insights',
      'Price alerts',
      'Data export (CSV/PDF)',
    ],
    cta: 'Upgrade Now',
  },
  {
    id: 'pro',
    name: 'Pro Yearly',
    tier: 'pro',
    price: '₹2,499',
    period: '/year',
    description: 'Save 30% with annual plan',
    features: [
      'All Pro features',
      'Priority support',
      'Advanced reports',
      'Portfolio optimization',
      'Tax insights',
      'Custom alerts',
    ],
    highlighted: true,
    badge: 'Best Value',
    cta: 'Get Annual Plan',
  },
];

const PlanCard = ({
  plan,
  isActive,
  onUpgrade,
  colors,
  index,
}: {
  plan: Plan;
  isActive: boolean;
  onUpgrade: (planId: string) => void;
  colors: any;
  index: number;
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = async () => {
    scale.value = withTiming(0.95, { duration: 100 });
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const borderColor = plan.highlighted ? colors.primary : colors.border;
  const borderWidth = plan.highlighted ? 2 : 1;
  const backgroundColor = plan.highlighted ? colors.surface : 'transparent';

  return (
    <Animated.View
      style={[
        styles.planCardContainer,
        animStyle,
        {
          entering: FadeInDown.delay(index * 100).duration(400),
        },
      ]}
    >
      {/* Badge */}
      {plan.badge && (
        <View
          style={[
            styles.badge,
            { backgroundColor: colors.primary },
          ]}
        >
          <Text style={styles.badgeText}>{plan.badge}</Text>
        </View>
      )}

      <View
        style={[
          styles.planCard,
          {
            backgroundColor,
            borderColor,
            borderWidth,
          },
        ]}
      >
        {/* Plan Header */}
        <View style={styles.planHeader}>
          <Text
            style={[
              styles.planName,
              { color: colors.text },
            ]}
          >
            {plan.name}
          </Text>
          <Text
            style={[
              styles.planDescription,
              { color: colors.textSecondary },
            ]}
          >
            {plan.description}
          </Text>
        </View>

        {/* Price */}
        <View style={styles.priceSection}>
          <Text
            style={[
              styles.price,
              { color: plan.highlighted ? colors.primary : colors.text },
            ]}
          >
            {plan.price}
          </Text>
          <Text
            style={[
              styles.period,
              { color: colors.textSecondary },
            ]}
          >
            {plan.period}
          </Text>
        </View>

        {/* Features List */}
        <View style={styles.featuresSection}>
          {plan.features.map((feature, idx) => (
            <View key={idx} style={styles.featureRow}>
              <MaterialCommunityIcons
                name="check-circle"
                size={18}
                color={colors.success}
                style={styles.featureIcon}
              />
              <Text
                style={[
                  styles.featureText,
                  { color: colors.text },
                ]}
              >
                {feature}
              </Text>
            </View>
          ))}
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={[
            styles.ctaButton,
            {
              backgroundColor: isActive
                ? colors.surface
                : colors.primary,
              borderColor: isActive ? colors.border : colors.primary,
              borderWidth: isActive ? 1 : 0,
            },
          ]}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => !isActive && onUpgrade(plan.id)}
          disabled={isActive}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.ctaText,
              {
                color: isActive ? colors.textSecondary : '#fff',
              },
            ]}
          >
            {isActive ? plan.cta : plan.cta}
          </Text>
          {!isActive && (
            <MaterialCommunityIcons
              name="arrow-right"
              size={16}
              color="#fff"
              style={styles.ctaIcon}
            />
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const ErrorState = ({ error, colors, onRetry }: any) => (
  <Animated.View
    style={styles.errorContainer}
    entering={FadeInDown.duration(400)}
  >
    <MaterialCommunityIcons
      name="alert-circle"
      size={64}
      color={colors.danger}
      style={{ marginBottom: spacing.l, opacity: 0.7 }}
    />
    <Text style={[styles.errorTitle, { color: colors.text }]}>
      Failed to Load Plans
    </Text>
    <Text
      style={[
        styles.errorDesc,
        { color: colors.textSecondary },
      ]}
    >
      {error || 'Unable to load subscription plans'}
    </Text>
    <TouchableOpacity
      style={[
        styles.retryButton,
        { backgroundColor: colors.primary },
      ]}
      onPress={onRetry}
      activeOpacity={0.8}
    >
      <MaterialCommunityIcons name="refresh" size={18} color="#fff" />
      <Text style={styles.retryButtonText}>Try Again</Text>
    </TouchableOpacity>
  </Animated.View>
);

const SkeletonLoader = ({ colors }: any) => (
  <View style={styles.skeletonContainer}>
    {[1, 2, 3].map((i) => (
      <Animated.View
        key={i}
        style={[
          styles.skeletonCard,
          { backgroundColor: colors.surface },
        ]}
        entering={FadeInDown.delay(i * 100)}
      />
    ))}
  </View>
);

export const SubscriptionScreen = ({ navigation }: any) => {
  const { colors } = useAppTheme();
  const {
    plans,
    currentPlan,
    isPremium,
    isLoading,
    error,
    fetchPlans,
    subscribe,
    clearError,
  } = useSubscriptionStore();

  const [isSubmitting, setIsSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      console.log('🎯 SubscriptionScreen mounted, fetching plans...');
      fetchPlans().catch(console.error);

      return () => {
        console.log('🎯 SubscriptionScreen unmounted');
      };
    }, [fetchPlans])
  );

  const handleUpgrade = async (planId: string) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await subscribe(planId);
      
      // Show success animation
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );
      
      // Optional: Show success message or navigate
      console.log('✅ Subscription successful:', planId);
    } catch (err) {
      console.error('❌ Subscription failed:', err);
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = useCallback(() => {
    clearError();
    fetchPlans().catch(console.error);
  }, [clearError, fetchPlans]);

  // Determine what to show
  if (error) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ErrorState error={error} colors={colors} onRetry={handleRetry} />
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <SkeletonLoader colors={colors} />
      </SafeAreaView>
    );
  }

  const displayPlans = plans.length > 0 ? plans : MOCK_PLANS;
  const activePlan = displayPlans.find(p => p.tier === currentPlan) || displayPlans[0];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          style={styles.header}
          entering={FadeInDown.duration(300)}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.backButton}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Upgrade to Premium
          </Text>

          <View style={styles.spacer} />
        </Animated.View>

        {/* Subtitle */}
        <Animated.View
          style={styles.subtitle}
          entering={FadeInDown.delay(100).duration(300)}
        >
          <Text
            style={[
              styles.subtitleText,
              { color: colors.textSecondary },
            ]}
          >
            Unlock powerful features to master your finances
          </Text>
        </Animated.View>

        {/* Plans */}
        <View style={styles.plansContainer}>
          {displayPlans.map((plan, idx) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isActive={activePlan?.id === plan.id}
              onUpgrade={handleUpgrade}
              colors={colors}
              index={idx}
            />
          ))}
        </View>

        {/* Footer Note */}
        <Animated.View
          style={styles.footer}
          entering={FadeInDown.delay(300).duration(300)}
        >
          <MaterialCommunityIcons
            name="shield-check"
            size={18}
            color={colors.success}
            style={styles.footerIcon}
          />
          <Text
            style={[
              styles.footerText,
              { color: colors.textSecondary },
            ]}
          >
            7-day free trial. Cancel anytime.
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Loading Overlay */}
      {isSubmitting && (
        <View
          style={[
            styles.loadingOverlay,
            { backgroundColor: 'rgba(0,0,0,0.4)' },
          ]}
        >
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.l,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  backButton: {
    padding: spacing.s,
    marginLeft: -spacing.s,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  spacer: {
    width: 40,
  },

  // Subtitle
  subtitle: {
    marginBottom: spacing.xxl,
    alignItems: 'center',
  },
  subtitleText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: '85%',
  },

  // Plans Container
  plansContainer: {
    marginBottom: spacing.xxl,
  },
  planCardContainer: {
    marginBottom: spacing.l,
  },

  badge: {
    position: 'absolute',
    top: -12,
    right: spacing.l,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    zIndex: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  planCard: {
    borderRadius: 16,
    padding: spacing.l,
    marginTop: spacing.s,
  },

  planHeader: {
    marginBottom: spacing.m,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.xs,
    letterSpacing: -0.3,
  },
  planDescription: {
    fontSize: 13,
    fontWeight: '400',
  },

  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.l,
  },
  price: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  period: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: spacing.xs,
  },

  featuresSection: {
    marginBottom: spacing.l,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  featureIcon: {
    marginRight: spacing.s,
  },
  featureText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },

  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.m,
    borderRadius: 12,
    gap: spacing.xs,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  ctaIcon: {
    marginLeft: spacing.xs,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.l,
    marginTop: spacing.l,
  },
  footerIcon: {
    marginRight: spacing.s,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Error State
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.l,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: spacing.s,
    textAlign: 'center',
  },
  errorDesc: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: spacing.l,
    textAlign: 'center',
    maxWidth: '90%',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderRadius: 8,
    gap: spacing.s,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Skeleton Loader
  skeletonContainer: {
    paddingVertical: spacing.l,
  },
  skeletonCard: {
    height: 320,
    borderRadius: 16,
    marginBottom: spacing.l,
  },

  // Loading Overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SubscriptionScreen;
