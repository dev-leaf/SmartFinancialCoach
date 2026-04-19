import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { useAppTheme } from '../../theme/Theme';

export function LockedFeatureOverlay({
  title,
  subtitle,
  ctaText = 'Upgrade',
  onPress,
}: {
  title: string;
  subtitle: string;
  ctaText?: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container} pointerEvents="box-none">
      <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFillObject} />
      <View style={[styles.card, { backgroundColor: 'rgba(18,18,20,0.85)', borderColor: 'rgba(255,255,255,0.12)' }]}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <TouchableOpacity
          style={[styles.cta, { backgroundColor: colors.primary }]}
          onPress={onPress}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>{ctaText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    overflow: 'hidden',
  },
  card: {
    width: '86%',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 14,
  },
  cta: {
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  ctaText: {
    color: '#fff',
    fontWeight: '800',
  },
});

