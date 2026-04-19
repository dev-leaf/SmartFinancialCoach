import React, { useCallback, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import Animated, { FadeInDown, SlideInUp } from 'react-native-reanimated';
import { useAppTheme, spacing, typography } from '../../theme/Theme';
import { useExpenseStore } from '../../store/expenseStore';
import CurrencyInput from '../../components/forms/CurrencyInput';
import CategoryPicker from '../../components/forms/CategoryPicker';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const QUICK_CATEGORIES = [
  { id: 'food', label: 'Food', icon: 'restaurant' },
  { id: 'transport', label: 'Transport', icon: 'directions-car' },
  { id: 'shopping', label: 'Shopping', icon: 'shopping-bag' },
  { id: 'entertainment', label: 'Entertainment', icon: 'movie' },
  { id: 'utilities', label: 'Utilities', icon: 'bolt' },
  { id: 'health', label: 'Health', icon: 'local-hospital' },
];

interface FormData {
  amount: string;
  category: string;
  description: string;
  date: Date;
}

export default function AddExpenseScreen({ navigation }: any) {
  const { colors } = useAppTheme();
  const { createExpense, loading } = useExpenseStore();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    amount: '',
    category: 'food',
    description: '',
    date: new Date(),
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Refs for input focus management
  const amountInputRef = useRef(null);
  const descriptionInputRef = useRef(null);

  // Auto-focus amount input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      amountInputRef.current?.focus?.();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle amount change
  const handleAmountChange = useCallback(
    (value: string) => {
      setFormData((prev) => ({
        ...prev,
        amount: value,
      }));
      if (errors.amount) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.amount;
          return newErrors;
        });
      }
    },
    [errors.amount]
  );

  // Handle category change
  const handleCategoryChange = useCallback(
    (categoryId: string) => {
      setFormData((prev) => ({
        ...prev,
        category: categoryId,
      }));
      if (errors.category) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.category;
          return newErrors;
        });
      }
    },
    [errors.category]
  );

  // Handle description change
  const handleDescriptionChange = useCallback((text: string) => {
    setFormData((prev) => ({
      ...prev,
      description: text,
    }));
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Create expense via Zustand store
      // Note: Backend auto-assigns date to current time, so we don't send it
      await createExpense({
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description || undefined,
      });

      // Show success feedback
      setShowSuccess(true);

      // Reset form after 1 second
      setTimeout(() => {
        setFormData({
          amount: '',
          category: 'food',
          description: '',
          date: new Date(),
        });
        setShowSuccess(false);

        // Navigate back
        navigation.goBack();
      }, 1000);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to save expense'
      );
    }
  }, [formData, validateForm, createExpense, navigation]);

  // Quick category selector
  const QuickCategories = () => (
    <Animated.View entering={FadeInDown.delay(200).duration(300)}>
      <View style={styles.quickCategorySection}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
          QUICK SELECT
        </Text>

        <View style={styles.quickCategoryGrid}>
          {QUICK_CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => handleCategoryChange(cat.id)}
              style={({ pressed }) => [
                styles.quickCategoryItem,
                {
                  backgroundColor:
                    formData.category === cat.id ? colors.primary : colors.surface,
                  borderColor:
                    formData.category === cat.id ? colors.primary : colors.divider,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.categoryIconBox,
                  {
                    backgroundColor:
                      formData.category === cat.id
                        ? 'rgba(255,255,255,0.2)'
                        : colors.background,
                  },
                ]}
              >
                <MaterialIcons
                  name={cat.icon as any}
                  size={20}
                  color={formData.category === cat.id ? '#fff' : colors.primary}
                />
              </View>
              <Text
                style={[
                  styles.quickCategoryLabel,
                  {
                    color: formData.category === cat.id ? '#fff' : colors.text,
                    fontWeight: formData.category === cat.id ? '600' : '500',
                  },
                ]}
                numberOfLines={1}
              >
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(300)}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>
                Add Expense
              </Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Quick & easy tracking
              </Text>
            </View>
          </Animated.View>

          {/* Amount Input - HERO SECTION */}
          <Animated.View entering={FadeInDown.delay(100).duration(300)}>
            <View style={styles.amountSection}>
              <CurrencyInput
                value={formData.amount}
                onChangeText={handleAmountChange}
                placeholder="0"
                ref={amountInputRef}
                autoFocus={true}
              />
              {errors.amount && (
                <Text style={[styles.error, { color: colors.danger }]}>
                  {errors.amount}
                </Text>
              )}
            </View>
          </Animated.View>

          {/* Quick Categories */}
          {formData.amount && <QuickCategories />}

          {/* Full Category Picker */}
          <Animated.View entering={FadeInDown.delay(300).duration(300)}>
            <View style={styles.categorySection}>
              <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
                CATEGORY
              </Text>
              <CategoryPicker
                selectedCategory={formData.category}
                onSelectCategory={handleCategoryChange}
                mode="grid"
              />
              {errors.category && (
                <Text style={[styles.error, { color: colors.danger }]}>
                  {errors.category}
                </Text>
              )}
            </View>
          </Animated.View>

          {/* Description Input */}
          <Animated.View entering={FadeInDown.delay(400).duration(300)}>
            <View style={styles.descriptionSection}>
              <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
                NOTES (OPTIONAL)
              </Text>
              <Input
                placeholder="What was it for?"
                value={formData.description}
                onChangeText={handleDescriptionChange}
                ref={descriptionInputRef}
              />
            </View>
          </Animated.View>

          <View style={{ height: spacing.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky Save Button */}
      <Animated.View
        entering={SlideInUp.duration(300)}
        style={[
          styles.buttonContainer,
          { backgroundColor: colors.background, borderTopColor: colors.divider },
        ]}
      >
        <View>
          <Button
            label={showSuccess ? '✓ Saved!' : loading ? 'Saving...' : 'Save Expense'}
            variant={showSuccess ? 'primary' : 'primary'}
            onPress={handleSave}
            disabled={loading || showSuccess || !formData.amount}
            fullWidth
          />

          <Text style={[styles.helpText, { color: colors.textMuted }]}>
            Tap to save • Swipe back to cancel
          </Text>
        </View>
      </Animated.View>

      {/* Success Toast */}
      {showSuccess && (
        <Animated.View
          entering={SlideInUp.duration(300)}
          style={[styles.successToast, { backgroundColor: colors.success }]}
        >
          <MaterialIcons name="check-circle" size={24} color="#fff" />
          <Text style={styles.successText}>Expense saved!</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.l,
  },
  title: {
    ...typography.title,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  amountSection: {
    marginBottom: spacing.l,
  },
  error: {
    fontSize: 12,
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  quickCategorySection: {
    marginBottom: spacing.l,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.s,
  },
  quickCategoryGrid: {
    flexDirection: 'row',
    gap: spacing.s,
    marginBottom: spacing.l,
  },
  quickCategoryItem: {
    flex: 1,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.xs,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: spacing.xs,
  },
  categoryIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickCategoryLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  categorySection: {
    marginBottom: spacing.l,
  },
  descriptionSection: {
    marginBottom: spacing.l,
  },
  buttonContainer: {
    borderTopWidth: 1,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    paddingBottom: spacing.l,
  },
  helpText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.s,
    fontWeight: '400',
  },
  successToast: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: 12,
    alignItems: 'center',
    gap: spacing.s,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  successText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
