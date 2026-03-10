import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing, elevation, radius, layout } from '../lib/design-system';

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xxl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginBottom: spacing.xl,
    width: '100%',
    ...elevation.sm,
    borderWidth: layout.borderWidth.thin,
    borderColor: colors.neutral[200],
  },
});

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      {children}
    </View>
  );
}
