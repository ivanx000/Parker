import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MapPinIcon, PaperAirplaneIcon, MapIcon } from 'react-native-heroicons/outline';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors, spacing, typography, radius, layout, elevation } from '../../lib/design-system';

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
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.xs,
  },
  inactiveDot: {
    backgroundColor: colors.neutral[300],
  },
  activeDot: {
    backgroundColor: colors.brand[500],
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
    marginBottom: spacing.xxl,
  },
  featureList: {
    width: '100%',
    gap: spacing.lg + spacing.xs,
  },
  featureItem: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brand[500],
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.sm,
  },
  iconCenterWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
    paddingTop: spacing.xs,
  },
  featureTitle: {
    ...typography.bodyBold,
    color: colors.neutral[950],
    marginBottom: spacing.xs + 2,
  },
  featureDescription: {
    ...typography.caption,
    color: colors.neutral[600],
  },
  bottomButton: {
    width: '100%',
    maxWidth: layout.maxWidth.content,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
});

export default function FeaturesScreen({ onNext }: { onNext: () => void }) {
  const dotsAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const feature1Anim = useRef(new Animated.Value(0)).current;
  const feature2Anim = useRef(new Animated.Value(0)).current;
  const feature3Anim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
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
      Animated.timing(feature1Anim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(feature2Anim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(feature3Anim, {
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
        <View style={[styles.dot, styles.inactiveDot]} />
        <View style={[styles.dot, styles.activeDot]} />
        <View style={[styles.dot, styles.inactiveDot]} />
      </Animated.View>

      <View style={styles.contentArea}>
        <Animated.Text 
          style={[
            styles.title,
            {
              opacity: titleAnim,
              transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
            },
          ]}
        >
          Parking Made Simple
        </Animated.Text>

        <View style={styles.featureList}>
          <Animated.View 
            style={[
              styles.featureItem,
              {
                opacity: feature1Anim,
                transform: [{ translateY: feature1Anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
              },
            ]}
          >
            <View style={styles.featureIcon}>
              <MapPinIcon size={24} color={colors.neutral[0]} strokeWidth={1.5} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Save Your Spot Instantly</Text>
              <Text style={styles.featureDescription}>Tap once to mark where you parked</Text>
            </View>
          </Animated.View>

          <Animated.View 
            style={[
              styles.featureItem,
              {
                opacity: feature2Anim,
                transform: [{ translateY: feature2Anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
              },
            ]}
          >
            <View style={styles.featureIcon}>
              <View style={styles.iconCenterWrap}>
                <PaperAirplaneIcon size={22} color={colors.neutral[0]} strokeWidth={1.75} />
              </View>
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Find Your Way Back</Text>
              <Text style={styles.featureDescription}>Get directions straight to your car</Text>
            </View>
          </Animated.View>

          <Animated.View 
            style={[
              styles.featureItem,
              {
                opacity: feature3Anim,
                transform: [{ translateY: feature3Anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
              },
            ]}
          >
            <View style={styles.featureIcon}>
              <MapIcon size={24} color={colors.neutral[0]} strokeWidth={1.5} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Never Forget Again</Text>
              <Text style={styles.featureDescription}>Your parking location is always saved</Text>
            </View>
          </Animated.View>
        </View>
      </View>

      {/* Bottom Button */}
      <Animated.View 
        style={[
          styles.bottomButton,
          {
            opacity: buttonAnim,
            transform: [{ translateY: buttonAnim.interpolate({ inputRange: [0, 1], outputRange: [-15, 0] }) }],
          },
        ]}
      >
        <PrimaryButton 
          onPress={onNext}
        >
          Next
        </PrimaryButton>
      </Animated.View>
    </View>
  );
}
