import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { PrimaryButton } from '../../components/PrimaryButton';
import { MapVisualization } from '../../components/MapVisualization';
import { colors, spacing, typography, radius, layout } from '../../lib/design-system';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.huge,
    paddingBottom: spacing.xxl,
    backgroundColor: colors.neutral[50],
  },
  progressDots: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.xs,
  },
  activeDot: {
    backgroundColor: colors.brand[500],
  },
  inactiveDot: {
    backgroundColor: colors.neutral[300],
  },
  contentArea: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: layout.maxWidth.content,
    paddingHorizontal: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.neutral[950],
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  mapPlaceholder: {
    width: '100%',
    height: 240,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    marginBottom: spacing.xl,
  },
  subtitle: {
    ...typography.body,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  bottomContainer: {
    width: '100%',
    maxWidth: layout.maxWidth.content,
  },
});

export default function WelcomeScreen({ onNext }: { onNext: () => void }) {
  const dotsAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const mapAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(100, [
      Animated.timing(dotsAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(titleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(mapAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(subtitleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Progress Dots */}
      <Animated.View 
        style={[
          styles.progressDots,
          {
            opacity: dotsAnim,
            transform: [{ translateY: dotsAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
          },
        ]}
      >
        <View style={[styles.dot, styles.activeDot]} />
        <View style={[styles.dot, styles.inactiveDot]} />
        <View style={[styles.dot, styles.inactiveDot]} />
      </Animated.View>

      {/* Content Area - Title, Map, Subtitle Centered */}
      <View style={styles.contentArea}>
        {/* Title */}
        <Animated.Text 
          style={[
            styles.title,
            {
              opacity: titleAnim,
              transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
            },
          ]}
        >
          Do you often forget where you parked?
        </Animated.Text>

        {/* Map */}
        <Animated.View 
          style={[
            styles.mapPlaceholder,
            {
              opacity: mapAnim,
              transform: [{ translateY: mapAnim.interpolate({ inputRange: [0, 1], outputRange: [-48, 0] }) }],
            },
          ]}
        >
          <MapVisualization />
        </Animated.View>

        {/* Subtitle */}
        <Animated.Text 
          style={[
            styles.subtitle,
            {
              opacity: subtitleAnim,
              transform: [{ translateY: subtitleAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 0] }) }],
            },
          ]}
        >
        You're not alone. Parker is here to help
        </Animated.Text>
      </View>

      {/* Bottom Button */}
      <Animated.View 
        style={[
          styles.bottomContainer,
          {
            opacity: buttonAnim,
            transform: [{ translateY: buttonAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
          },
        ]}
      >
        <PrimaryButton 
          onPress={onNext}
        >
          Get Started
        </PrimaryButton>
      </Animated.View>
    </View>
  );
}
