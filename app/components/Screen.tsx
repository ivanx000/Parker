import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, layout } from '../lib/design-system';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    width: '100%',
    maxWidth: layout.maxWidth.content,
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 0,
  },
  contentContainerFullWidth: {
    maxWidth: '100%',
  },
  contentContainerNoPadding: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
});

export function Screen({
  children,
  fullWidth = false,
  noPadding = false,
}: {
  children: React.ReactNode;
  fullWidth?: boolean;
  noPadding?: boolean;
}) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={[
        styles.contentContainer, 
        fullWidth && styles.contentContainerFullWidth,
        noPadding && styles.contentContainerNoPadding
      ]}>
        {children}
      </View>
    </SafeAreaView>
  );
}
