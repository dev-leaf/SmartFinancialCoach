import React, { useState, useEffect } from 'react';
import { TextInput, StyleSheet, View, Text } from 'react-native';
import { useAppTheme } from '../../theme/Theme';

interface CurrencyInputProps {
  value: number;
  onChangeText: (value: number) => void;
  placeholder?: string;
  error?: string;
  label?: string;
  autoFocus?: boolean;
}

export const CurrencyInput = ({
  value,
  onChangeText,
  placeholder = 'Enter amount',
  error,
  label,
  autoFocus = false,
}: CurrencyInputProps) => {
  const { colors, isDark } = useAppTheme();
  const [displayValue, setDisplayValue] = useState(value ? value.toString() : '');

  useEffect(() => {
    if (value) {
      setDisplayValue(value.toString());
    }
  }, [value]);

  const handleChange = (text: string) => {
    // Only allow numbers and decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = cleaned.split('.');
    const finalValue = parts.length > 2 ? parts[0] + '.' + parts[1] : cleaned;

    setDisplayValue(finalValue);

    // Convert to number and pass to parent
    const numValue = parseFloat(finalValue) || 0;
    onChangeText(numValue);
  };

  const formatForDisplay = (num: number) => {
    if (!num) return '';
    return num.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: isDark ? '#2A2A2E' : '#F5F5F7',
            borderColor: error ? colors.danger : colors.divider,
          },
        ]}
      >
        <Text style={[styles.currencyPrefix, { color: colors.text }]}>₹</Text>

        <TextInput
          placeholder={placeholder}
          value={displayValue}
          onChangeText={handleChange}
          keyboardType="decimal-pad"
          placeholderTextColor={colors.textMuted}
          autoFocus={autoFocus}
          style={[
            styles.input,
            {
              color: colors.text,
              flex: 1,
            },
          ]}
        />
      </View>

      {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}

      {value > 0 && (
        <Text style={[styles.formatted, { color: colors.textMuted }]}>
          {formatForDisplay(value)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 56,
  },
  currencyPrefix: {
    fontSize: 24,
    fontWeight: '700',
    marginRight: 8,
  },
  input: {
    fontSize: 24,
    fontWeight: '600',
    padding: 0,
  },
  error: {
    fontSize: 12,
    fontWeight: '500',
  },
  formatted: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
});

export default CurrencyInput;
