import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { spacing } from '../../theme/Theme';

interface Asset {
  name: string;
  symbol: string;
  type: 'stock' | 'crypto' | 'mutual_fund';
  currentPrice: number;
}

interface AssetSearchListProps {
  assets: Asset[];
  onSelect: (asset: Asset) => void;
  colors: any;
}

const fmt = (n: number, digits = 2) =>
  n.toLocaleString('en-IN', { maximumFractionDigits: digits });

const getAssetIcon = (type: string) => {
  switch (type) {
    case 'stock':
      return 'trending-up';
    case 'crypto':
      return 'bitcoin';
    case 'mutual_fund':
      return 'chart-pie';
    default:
      return 'tag';
  }
};

const AssetRow = ({ asset, colors, onSelect, index }) => {
  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(asset);
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50)}
      style={{ marginBottom: spacing.s }}
    >
      <TouchableOpacity
        style={[
          styles.assetRow,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.assetLeft}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: colors.primary + '20' },
            ]}
          >
            <MaterialCommunityIcons
              name={getAssetIcon(asset.type)}
              size={20}
              color={colors.primary}
            />
          </View>
          <View style={styles.assetInfo}>
            <Text style={[styles.assetName, { color: colors.text }]}>
              {asset.name}
            </Text>
            <Text style={[styles.assetSymbol, { color: colors.textSecondary }]}>
              {asset.symbol}
            </Text>
          </View>
        </View>

        <View style={styles.assetRight}>
          <Text style={[styles.assetPrice, { color: colors.text }]}>
            ₹{fmt(asset.currentPrice, 2)}
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={colors.textSecondary}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const AssetSearchList: React.FC<AssetSearchListProps> = ({
  assets,
  onSelect,
  colors,
}) => {
  return (
    <View style={styles.container}>
      {assets.map((asset, index) => (
        <AssetRow
          key={asset.symbol}
          asset={asset}
          colors={colors}
          onSelect={onSelect}
          index={index}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.l,
  },
  assetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.m,
    borderRadius: 12,
    borderBottomWidth: 1,
  },
  assetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  assetInfo: {
    flex: 1,
  },
  assetName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  assetSymbol: {
    fontSize: 12,
    fontWeight: '500',
  },
  assetRight: {
    alignItems: 'flex-end',
    marginLeft: spacing.m,
  },
  assetPrice: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
});
