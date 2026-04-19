import React from 'react';
import { View, ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAppTheme } from '../../theme/Theme';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color?: string;
}

interface CategoryPickerProps {
  categories?: Category[];
  selectedId?: string;
  selectedCategory?: string;
  onSelect?: (category: Category) => void;
  onSelectCategory?: (categoryId: string) => void;
  scrollEnabled?: boolean;
  mode?: 'scroll' | 'grid';
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food', name: 'Food', icon: 'restaurant' },
  { id: 'transport', name: 'Transport', icon: 'directions-car' },
  { id: 'shopping', name: 'Shopping', icon: 'shopping-bag' },
  { id: 'entertainment', name: 'Entertainment', icon: 'movie' },
  { id: 'utilities', name: 'Utilities', icon: 'home' },
  { id: 'health', name: 'Health', icon: 'favorite' },
  { id: 'education', name: 'Education', icon: 'school' },
  { id: 'groceries', name: 'Groceries', icon: 'local-grocery-store' },
  { id: 'fuel', name: 'Fuel', icon: 'local-gas-station' },
  { id: 'insurance', name: 'Insurance', icon: 'security' },
  { id: 'rent', name: 'Rent', icon: 'apartment' },
  { id: 'other', name: 'Other', icon: 'more-horiz' },
];

export const CategoryPicker = ({
  categories = DEFAULT_CATEGORIES,
  selectedId,
  selectedCategory,
  onSelect,
  onSelectCategory,
  scrollEnabled,
  mode = 'grid',
}: CategoryPickerProps) => {
  const { colors } = useAppTheme();

  // Handle both prop naming conventions
  const currentSelectedId = selectedId || selectedCategory;
  const scroll = scrollEnabled !== undefined ? scrollEnabled : mode === 'scroll';

  const CategoryButton = ({ category }: { category: Category }) => {
    const isSelected = currentSelectedId === category.id;

    return (
      <Pressable
        onPress={() => {
          // Handle both callback conventions
          if (onSelect) {
            onSelect(category);
          } else if (onSelectCategory) {
            onSelectCategory(category.id);
          }
        }}
        style={[
          styles.categoryButton,
          {
            backgroundColor: isSelected ? colors.primary : colors.surface,
            borderColor: isSelected ? colors.primary : colors.divider,
          },
        ]}
      >
        <MaterialIcons
          name={category.icon as any}
          size={24}
          color={isSelected ? colors.white : colors.text}
        />
        <Text
          style={[
            styles.categoryLabel,
            {
              color: isSelected ? colors.white : colors.text,
            },
          ]}
          numberOfLines={1}
        >
          {category.name}
        </Text>
      </Pressable>
    );
  };

  if (scroll) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((cat) => (
          <CategoryButton key={cat.id} category={cat} />
        ))}
      </ScrollView>
    );
  }

  return (
    <View style={styles.gridContainer}>
      {categories.map((cat) => (
        <View key={cat.id} style={styles.gridItem}>
          <CategoryButton category={cat} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    marginVertical: 12,
  },
  scrollContent: {
    gap: 8,
    paddingHorizontal: 0,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 12,
  },
  gridItem: {
    width: '48%',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 50,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});

export default CategoryPicker;
