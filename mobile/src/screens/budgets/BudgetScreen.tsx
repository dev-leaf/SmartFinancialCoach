import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { useBudgetStore } from '../../store';
import { formatCurrency, getMonthName } from '../../utils/formatting';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAppTheme, spacing } from '../../theme/Theme';
import PressableScale from '../../components/PressableScale';

export default function BudgetScreen({ navigation }: any) {
  const { budget, isLoading, fetchBudget } = useBudgetStore();
  const { colors, isDark } = useAppTheme();

  // Refetch budget when screen comes into focus (after SetBudgetScreen returns)
  useFocusEffect(
    React.useCallback(() => {
      fetchBudget();
    }, [fetchBudget])
  );

  if (isLoading && !budget) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.skeletonHeader} />
        <View style={styles.skeletonCard} />
        <View style={styles.skeletonRow} />
      </SafeAreaView>
    );
  }

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const monthName = getMonthName(currentMonth);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.ScrollView 
        entering={FadeInDown.duration(400)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Budget Settings</Text>
          <Text style={[styles.subtitle, { color: colors.textDim }]}>Manage your monthly spending limit</Text>
        </View>

        {budget ? (
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <View style={[styles.budgetCard, { backgroundColor: isDark ? '#121214' : '#FFF', borderColor: colors.border }]}>
              <View style={styles.budgetCardHeader}>
                <View>
                  <Text style={[styles.budgetLabel, { color: colors.textDim }]}>Monthly Budget</Text>
                  <Text style={[styles.budgetMonth, { color: colors.text }]}>{monthName} {currentYear}</Text>
                </View>
                <MaterialIcons name="account-balance-wallet" size={28} color={colors.primary} />
              </View>

              <View style={styles.budgetAmount}>
                <Text style={[styles.amount, { color: colors.text }]}>{formatCurrency(budget.amount)}</Text>
              </View>

              <PressableScale
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('SetBudget')}
              >
                <MaterialIcons name="edit" size={20} color="#FFF" />
                <Text style={styles.buttonText}>Update Budget</Text>
              </PressableScale>
            </View>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <View style={[styles.noBudgetCard, { backgroundColor: isDark ? 'rgba(10, 132, 255, 0.1)' : 'rgba(10, 132, 255, 0.05)', borderColor: colors.primary }]}>
              <MaterialIcons name="info" size={32} color={colors.primary} />
              <Text style={[styles.noBudgetTitle, { color: colors.text }]}>No Budget Set</Text>
              <Text style={[styles.noBudgetDesc, { color: colors.textDim }]}>Create a monthly budget to track your spending limits</Text>
              
              <PressableScale
                style={[styles.noBudgetButton, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('SetBudget')}
              >
                <MaterialIcons name="add" size={20} color="#FFF" />
                <Text style={styles.noBudgetButtonText}>Set Budget Now</Text>
              </PressableScale>
            </View>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.tipsSection}>
          <Text style={[styles.tipsTitle, { color: colors.text }]}>Budget Tips</Text>
          
          <View style={[styles.tipCard, { backgroundColor: isDark ? '#18181A' : '#F8F9FB', borderColor: colors.border }]}>
            <MaterialIcons name="light-mode" size={20} color={colors.warning} />
            <Text style={[styles.tipText, { color: colors.text }]}>Set a budget based on your actual monthly income</Text>
          </View>

          <View style={[styles.tipCard, { backgroundColor: isDark ? '#18181A' : '#F8F9FB', borderColor: colors.border }]}>
            <MaterialIcons name="trending-down" size={20} color={colors.success} />
            <Text style={[styles.tipText, { color: colors.text }]}>Review expenses weekly to stay on track</Text>
          </View>

          <View style={[styles.tipCard, { backgroundColor: isDark ? '#18181A' : '#F8F9FB', borderColor: colors.border }]}>
            <MaterialIcons name="update" size={20} color={colors.primary} />
            <Text style={[styles.tipText, { color: colors.text }]}>Adjust budget when spending patterns change</Text>
          </View>
        </Animated.View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.m,
    paddingTop: spacing.l,
    paddingBottom: spacing.l,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: spacing.xxs,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
  },
  budgetCard: {
    marginHorizontal: spacing.m,
    borderRadius: 24,
    padding: spacing.l,
    borderWidth: 1,
    marginBottom: spacing.l,
  },
  budgetCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.l,
  },
  budgetLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.xxs,
  },
  budgetMonth: {
    fontSize: 16,
    fontWeight: '600',
  },
  budgetAmount: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.l,
  },
  currency: {
    fontSize: 32,
    fontWeight: '700',
    marginRight: spacing.xxs,
  },
  amount: {
    fontSize: 44,
    fontWeight: '700',
    lineHeight: 48,
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.s,
    borderRadius: 14,
    gap: spacing.xs,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  noBudgetCard: {
    marginHorizontal: spacing.m,
    borderRadius: 24,
    padding: spacing.l,
    borderWidth: 2,
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  noBudgetTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: spacing.m,
    marginBottom: spacing.xs,
  },
  noBudgetDesc: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: spacing.l,
    lineHeight: 20,
  },
  noBudgetButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.l,
    borderRadius: 12,
    gap: 8,
  },
  noBudgetButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  tipsSection: {
    paddingHorizontal: 16,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  skeletonHeader: {
    height: 28,
    width: '70%',
    marginTop: 40,
    marginHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#2C2C2E',
    marginBottom: 32,
  },
  skeletonCard: {
    height: 200,
    margin: 16,
    borderRadius: 24,
    backgroundColor: '#1C1C1E',
    marginBottom: 24,
  },
  skeletonRow: {
    height: 16,
    width: '90%',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: '#1C1C1E',
  },
  monthYear: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  noBudget: {
    paddingVertical: 24,
  },
  noBudgetText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 16,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    borderLeftColor: '#2196F3',
    borderLeftWidth: 4,
  },
  infoTitle: {
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 12,
  },
  infoText: {
    color: '#1565C0',
    marginBottom: 8,
    lineHeight: 20,
  },
});
