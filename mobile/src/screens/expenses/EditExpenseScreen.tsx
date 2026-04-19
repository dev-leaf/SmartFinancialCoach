import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, Button, Text, SegmentedButtons } from 'react-native-paper';
import { useExpenseStore } from '../../store';
import ErrorBanner from '../../components/ErrorBanner';
import { EXPENSE_CATEGORIES } from '../../utils/constants';

export default function EditExpenseScreen({ navigation, route }: any) {
  const { expense } = route.params;
  const [amount, setAmount] = useState(expense.amount.toString());
  const [category, setCategory] = useState(expense.category);
  const [description, setDescription] = useState(expense.description || '');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { updateExpense, isLoading } = useExpenseStore();

  const handleUpdateExpense = async () => {
    if (!amount) {
      setErrorMessage('Amount is required');
      setShowError(true);
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Please enter a valid amount');
      setShowError(true);
      return;
    }

    try {
      await updateExpense(expense.id, {
        amount: parsedAmount,
        category,
        description: description || undefined,
      });
      navigation.goBack();
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Failed to update expense');
      setShowError(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.form}>
          <TextInput
            label="Amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            editable={!isLoading}
            mode="outlined"
            style={styles.input}
          />

          <Text style={styles.label}>Category</Text>
          <SegmentedButtons
            value={category}
            onValueChange={setCategory}
            buttons={EXPENSE_CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
            style={styles.segmented}
          />

          <TextInput
            label="Description (Optional)"
            value={description}
            onChangeText={setDescription}
            editable={!isLoading}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleUpdateExpense}
            loading={isLoading}
            disabled={isLoading}
            style={styles.button}
          >
            Update Expense
          </Button>

          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            disabled={isLoading}
            style={styles.cancelButton}
          >
            Cancel
          </Button>
        </View>
      </ScrollView>

      <ErrorBanner
        visible={showError}
        message={errorMessage}
        onDismiss={() => setShowError(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    padding: 16,
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    marginBottom: 8,
  },
  segmented: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
  },
  cancelButton: {
    borderColor: '#999',
  },
});
