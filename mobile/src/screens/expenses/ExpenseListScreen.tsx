import React, { useState, useRef } from 'react';
import { View, StyleSheet, FlatList, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FAB, Text, Snackbar } from 'react-native-paper';
import { useExpenseStore } from '../../store';
import { Expense } from '../../types/expense';
import ExpenseCard from '../../components/ExpenseCard';
import Loading from '../../components/Loading';
import { useFocusEffect } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAppTheme } from '../../theme/Theme';
import * as Haptics from 'expo-haptics';

export default function ExpenseListScreen({ navigation }: any) {
  const { expenses, isLoading, fetchExpenses, deleteExpense, createExpense, setCurrentExpense } =
    useExpenseStore();
  const { colors, spacing } = useAppTheme();
  const insets = useSafeAreaInsets();
  
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const deletedExpenseRef = useRef<Expense | null>(null);

  // Calculate FAB position accounting for tab bar
  // Tab bar is ~76px on Android, ~88px on iOS
  const tabBarHeight = Platform.OS === 'ios' ? 88 : 76;
  const fabBottom = tabBarHeight + spacing.m;

  useFocusEffect(
    React.useCallback(() => {
      fetchExpenses();
    }, [fetchExpenses])
  );

  if (isLoading && expenses.length === 0) {
    return <Loading fullScreen message="Loading expenses..." />;
  }

  const handleEditExpense = (expense: Expense) => {
    setCurrentExpense(expense);
    navigation.navigate('EditExpense', { expense });
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const expenseToDel = expenses.find(e => e.id === expenseId);
      if (expenseToDel) deletedExpenseRef.current = expenseToDel;
      
      // Instantly delete from DB/Store optimistically
      await deleteExpense(expenseId);
      
      // Trigger Snackbar
      setSnackbarVisible(true);
    } catch (error) {
      // Silently handle error - user can retry
    }
  };

  const handleUndoDelete = async () => {
    if (deletedExpenseRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const { amount, category, description, walletId, currency } = deletedExpenseRef.current;
      await createExpense({
        amount,
        category,
        description,
        walletId: walletId ?? undefined,
        currency,
      });
      deletedExpenseRef.current = null;
      setSnackbarVisible(false);
    }
  };

  const renderExpense = ({ item }: { item: Expense }) => (
    <ExpenseCard
      expense={item}
      onEdit={handleEditExpense}
      onDelete={handleDeleteExpense}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {expenses.length > 0 ? (
        <FlatList
          data={expenses}
          renderItem={renderExpense}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.s, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <MaterialIcons name="receipt-long" size={64} color={colors.surface} />
          <Text style={[styles.emptyText, { color: colors.textDim }]}>No expenses yet.</Text>
          <Text style={[styles.emptySubtext, { color: colors.textDim }]}>Tap the + button to track your first transaction.</Text>
        </View>
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: colors.primary, right: spacing.m, bottom: fabBottom }]}
        color={colors.white}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          navigation.navigate('AddExpense');
        }}
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
        action={{
          label: 'UNDO',
          onPress: handleUndoDelete,
        }}
      >
        Expense deleted.
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
    paddingHorizontal: 32,
  },
  emptyText: {
    marginTop: 24,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    borderRadius: 28,
  },
});
