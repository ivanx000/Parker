import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../lib/design-system';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconContainer: {
    width: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...typography.caption,
    fontWeight: '500',
    color: colors.neutral[500],
  },
});

export function IconRow({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>{icon}</View>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}
