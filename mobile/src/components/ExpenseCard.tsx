import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Expense } from '../types/expense';
import { formatCurrency, formatDate, capitalize } from '../utils/formatting';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import * as Haptics from 'expo-haptics';
import PressableScale from './PressableScale';
import { useAppTheme } from '../theme/Theme';

interface ExpenseCardProps {
  expense: Expense;
  onPress?: (expense: Expense) => void;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expenseId: string) => void;
}

const CATEGORY_ICONS: { [key: string]: string } = {
  food: 'restaurant',
  transport: 'directions-car',
  entertainment: 'movie',
  shopping: 'shopping-bag',
  utilities: 'bolt',
  healthcare: 'hospital-box',
  education: 'school',
  other: 'category',
};

export default function ExpenseCard({
  expense,
  onPress,
  onEdit,
  onDelete,
}: ExpenseCardProps) {
  const { colors } = useAppTheme();
  const categoryIcon = CATEGORY_ICONS[expense.category.toLowerCase()] || 'category';

  const renderRightActions = () => {
    return (
      <View style={styles.rightActionsContainer}>
        {onEdit && (
          <PressableScale
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => onEdit(expense)}
          >
            <MaterialIcons name="edit" size={24} color="#FFFFFF" />
          </PressableScale>
        )}
        {onDelete && (
          <PressableScale
            style={[styles.actionButton, { backgroundColor: colors.danger }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
              onDelete(expense.id);
            }}
          >
            <MaterialIcons name="delete" size={24} color="#FFFFFF" />
          </PressableScale>
        )}
      </View>
    );
  };

  return (
    <Swipeable 
      renderRightActions={(onEdit || onDelete) ? renderRightActions : undefined}
      onSwipeableOpen={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})}
    >
      <PressableScale
        style={[styles.card, { backgroundColor: colors.background, borderBottomColor: colors.border }]}
        onPress={() => onPress?.(expense)}
        disabled={!onPress}
      >
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
             <MaterialIcons name={categoryIcon as any} size={20} color={colors.text} />
          </View>

          <View style={styles.middleColumn}>
            <Text style={[styles.category, { color: colors.text }]}>
              {capitalize(expense.category)}
            </Text>
            {expense.description ? (
              <Text style={[styles.description, { color: colors.textDim }]}>
                {expense.description}
              </Text>
            ) : null}
          </View>

          <View style={styles.rightColumn}>
            <Text style={[styles.amount, { color: colors.text }]}>{formatCurrency(expense.amount)}</Text>
            <Text style={[styles.date, { color: colors.textDim }]}>
              {formatDate(expense.date)}
            </Text>
          </View>
        </View>
      </PressableScale>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  middleColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  rightColumn: {
    alignItems: 'flex-end',
  },
  category: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
  },
  rightActionsContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginVertical: 1,
  },
  actionButton: {
    width: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
