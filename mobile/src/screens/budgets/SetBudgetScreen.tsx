import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBudgetStore } from '../../store';
import Loading from '../../components/Loading';
import { formatCurrency } from '../../utils/formatting';

export default function SetBudgetScreen({ navigation }: any) {
  const { budget, isLoading, setMonthlyBudget, fetchBudget, fetchBudgetSummary } = useBudgetStore();
  const [amount, setAmount] = useState(budget?.amount?.toString() ?? '');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);

  const handleSave = async () => {
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid budget amount.');
      return;
    }

    if (numericAmount < 0.01) {
      Alert.alert('Invalid amount', 'Budget amount must be at least ₹0.01.');
      return;
    }

    if (numericAmount > 999999.99) {
      Alert.alert('Invalid amount', 'Budget amount cannot exceed ₹999,999.99.');
      return;
    }

    // Round to 2 decimal places to match backend validation
    const roundedAmount = Math.round(numericAmount * 100) / 100;

    try {
      setSaving(true);
      await setMonthlyBudget({ amount: roundedAmount });
      // Refresh summary to update dashboard
      await fetchBudgetSummary();
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Unable to save budget', error?.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading && !budget) {
    return <Loading fullScreen message="Loading budget settings..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Set Monthly Budget</Text>
        <Text style={styles.subtitle}>Keep your spending under control with a clear budget.</Text>

        <View style={styles.field}> 
          <Text style={styles.label}>Budget Amount</Text>
          <View style={styles.inputRow}>
            <Text style={styles.currency}>₹</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#999"
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Month</Text>
          <TextInput
            value={month}
            onChangeText={setMonth}
            keyboardType="numeric"
            placeholder="MM"
            placeholderTextColor="#999"
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Year</Text>
          <TextInput
            value={year}
            onChangeText={setYear}
            keyboardType="numeric"
            placeholder="YYYY"
            placeholderTextColor="#999"
            style={styles.input}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
          <Text style={styles.buttonText}>{saving ? 'Saving...' : budget ? 'Update Budget' : 'Save Budget'}</Text>
        </TouchableOpacity>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Current Budget</Text>
          <Text style={styles.summaryAmount}>{formatCurrency(budget?.amount ?? 0)}</Text>
          <Text style={styles.summarySubtitle}>{budget ? 'Use this budget to track your spending.' : 'No budget set yet.'}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 24,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    color: '#555',
    marginBottom: 8,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    backgroundColor: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  currency: {
    fontSize: 18,
    color: '#111',
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#111',
    padding: 0,
  },
  button: {
    marginTop: 16,
    backgroundColor: '#111',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  summaryCard: {
    marginTop: 28,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 20,
  },
  summaryTitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111',
    marginBottom: 6,
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#666',
  },
});
