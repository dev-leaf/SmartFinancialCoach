import React from 'react';
import { TextInput, StyleSheet, ViewStyle, View, Text } from 'react-native';
import { useAppTheme } from '../../theme/Theme';

interface InputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  editable?: boolean;
  error?: string;
  label?: string;
  prefix?: string;
  style?: ViewStyle;
}

export const Input = ({
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  editable = true,
  error,
  label,
  prefix,
  style,
}: InputProps) => {
  const { colors, isDark } = useAppTheme();

  return (
    <View style={[styles.container, style]}>
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
        {prefix && <Text style={[styles.prefix, { color: colors.text }]}>{prefix}</Text>}
        
        <TextInput
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          editable={editable}
          placeholderTextColor={colors.textMuted}
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
    height: 48,
  },
  prefix: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  input: {
    fontSize: 16,
    fontWeight: '500',
  },
  error: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default Input;
