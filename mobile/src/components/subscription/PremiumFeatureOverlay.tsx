import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing } from '../../theme/Theme';

interface PremiumFeatureOverlayProps {
  isLocked: boolean;
  onUpgrade: () => void;
  blurIntensity?: number;
  colors: any;
}

/**
 * PremiumFeatureOverlay
 * Shows a blur overlay with "Upgrade to unlock" message for locked features
 */
export const PremiumFeatureOverlay: React.FC<PremiumFeatureOverlayProps> = ({
  isLocked,
  onUpgrade,
  blurIntensity = 80,
  colors,
}) => {
  if (!isLocked) return null;

  return (
    <BlurView intensity={blurIntensity} style={styles.container} tint="dark">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <MaterialCommunityIcons
            name="lock"
            size={48}
            color={colors.primary}
            style={styles.icon}
          />
          <Text style={[styles.title, { color: colors.text }]}>
            Premium Feature
          </Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            Unlock advanced analytics with Premium
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={onUpgrade}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Upgrade Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.l,
  },
  icon: {
    marginBottom: spacing.m,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: spacing.l,
    maxWidth: 240,
  },
  button: {
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default PremiumFeatureOverlay;
