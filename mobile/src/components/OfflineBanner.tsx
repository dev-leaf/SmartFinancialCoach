import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useNetworkStore } from '../store/networkStore';
import { useAppTheme } from '../theme/Theme';

export default function OfflineBanner() {
  const isOnline = useNetworkStore((state) => state.isOnline);
  const { colors, radii } = useAppTheme();

  if (isOnline) {
    return null;
  }

  return (
    <Animated.View entering={FadeInDown.duration(250)} exiting={FadeOutUp.duration(200)} style={styles.wrapper}>
      <View style={[styles.banner, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md }]}>
        <MaterialIcons name="wifi-off" size={18} color={colors.warning} />
        <Text style={[styles.text, { color: colors.text }]}>
          You are offline. Changes will sync again once your connection is back.
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  text: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
});
