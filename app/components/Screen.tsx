import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, layout } from '../lib/design-system';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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
  contentContainerNoBottomPadding: {
    paddingBottom: 0,
  },
});

export function Screen({
  children,
  fullWidth = false,
  noPadding = false,
  noBottomPadding = false,
  safeAreaEdges,
}: {
  children: React.ReactNode;
  fullWidth?: boolean;
  noPadding?: boolean;
  noBottomPadding?: boolean;
  safeAreaEdges?: Edge[];
}) {
  const { height: windowHeight } = useWindowDimensions();
  const responsivePaddingTop =
    windowHeight >= 900
      ? spacing.xxl
      : windowHeight >= 820
        ? spacing.xl
        : windowHeight >= 760
          ? spacing.lg
          : spacing.md;

  const responsivePaddingBottom =
    windowHeight >= 820
      ? spacing.lg
      : spacing.md;

  return (
    <SafeAreaView style={styles.container} edges={safeAreaEdges}>
      <View style={[
        styles.contentContainer, 
        { paddingTop: responsivePaddingTop, paddingBottom: responsivePaddingBottom },
        fullWidth && styles.contentContainerFullWidth,
        noPadding && styles.contentContainerNoPadding,
        noBottomPadding && styles.contentContainerNoBottomPadding,
      ]}>
        {children}
      </View>
    </SafeAreaView>
  );
}
