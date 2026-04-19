import React, { useCallback, memo } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useWalletStore } from '../store/walletStore';
import { formatCurrency } from '../utils/formatting';
import PressableScale from './PressableScale';
import { useAppTheme } from '../theme/Theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.82;

function WalletCards() {
  const { wallets, activeWalletId, setActiveWallet } = useWalletStore();
  const { spacing } = useAppTheme();

  const renderItem = useCallback(({ item }: { item: any }) => {
    const isActive = item.id === activeWalletId;

    return (
      <PressableScale
        style={{ marginLeft: item === wallets[0] ? spacing.m : 0, marginRight: spacing.s }}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          setActiveWallet(item.id);
        }}
      >
        <LinearGradient
          colors={isActive ? ['#0A84FF', '#0060D9'] : ['#1C1C1E', '#121214']}
          start={[0, 0]}
          end={[1, 1]}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardName, { color: '#FFF' }]}>{item.name}</Text>
            <MaterialIcons
              name={item.type === 'BANK' ? 'account-balance' : item.type === 'CASH' ? 'payments' : 'credit-card'}
              size={24}
              color="rgba(255,255,255,0.9)"
            />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardBalanceLabel}>Current Balance</Text>
            <Text style={styles.cardBalance}>{formatCurrency(item.balance, item.currency)}</Text>
          </View>
        </LinearGradient>
      </PressableScale>
    );
  }, [activeWalletId, wallets, spacing, setActiveWallet]);

  if (wallets.length === 0) return null;

  return (
    <Animated.View entering={FadeInUp.duration(600)} style={styles.container}>
      <FlatList
        horizontal
        data={wallets}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 4 }}
        snapToInterval={CARD_WIDTH + spacing.s}
        snapToAlignment="start"
        decelerationRate="fast"
        pagingEnabled={false}
      />
    </Animated.View>
  );
}

export default memo(WalletCards);

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  card: {
    width: CARD_WIDTH,
    minHeight: 180,
    borderRadius: 28,
    padding: 24,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardBody: {
    justifyContent: 'flex-end',
  },
  cardBalanceLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  cardBalance: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFF',
  },
});
