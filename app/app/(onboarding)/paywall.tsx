import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { SparklesIcon, CheckCircleIcon } from 'react-native-heroicons/solid';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SubscriptionTier } from '../../types/parking';
import { requestLocationPermission } from '../../lib/location';
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
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.caption,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  tierList: {
    width: '100%',
  },
  tierButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    borderWidth: layout.borderWidth.medium,
    borderColor: colors.neutral[200],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    ...elevation.sm,
  },
  tierButtonActive: {
    borderColor: colors.brand[500],
    backgroundColor: colors.brand[50],
  },
  tierInfo: {
    flex: 1,
  },
  tierName: {
    ...typography.bodyBold,
    color: colors.neutral[950],
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  tierDescription: {
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

export default function PaywallScreen({
  onComplete,
  onSelectTier,
}: {
  onComplete: () => void;
  onSelectTier: (tier: SubscriptionTier) => Promise<boolean>;
}) {
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('Free');
  
  const dotsAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;
  const tier1Anim = useRef(new Animated.Value(0)).current;
  const tier2Anim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(110, [
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
      Animated.timing(subtitleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(tier1Anim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(tier2Anim, {
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

  const tiers: SubscriptionTier[] = ['Free', 'Pro'];
  const tierAnims = [tier1Anim, tier2Anim];

  const handleTierPress = (selectedTier: SubscriptionTier) => {
    setSelectedTier(selectedTier);
  };

  const handleGetStarted = async () => {
    if (selectedTier === 'Pro') {
      const canContinue = await onSelectTier('Pro');
      if (!canContinue) {
        return;
      }
    }

    await requestLocationPermission();
    onComplete();
  };

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
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={[styles.dot, styles.activeDot]} />
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
          Choose Your Plan
        </Animated.Text>
        
        <Animated.Text 
          style={[
            styles.subtitle,
            {
              opacity: subtitleAnim,
              transform: [{ translateY: subtitleAnim.interpolate({ inputRange: [0, 1], outputRange: [-15, 0] }) }],
            },
          ]}
        >
          Unlock unlimited navigations and never worry about finding your car again.
        </Animated.Text>

        <View style={styles.tierList}>
          {tiers.map((t, index) => (
            <Animated.View
              key={t}
              style={{
                opacity: tierAnims[index],
                transform: [{ translateY: tierAnims[index].interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
              }}
            >
              <TouchableOpacity
                style={[styles.tierButton, selectedTier === t && styles.tierButtonActive]}
                onPress={() => handleTierPress(t)}
              >
                <View style={styles.tierInfo}>
                  <View style={styles.tierName}>
                    <Text style={{ ...typography.bodyBold, color: colors.neutral[950] }}>
                      {t}
                    </Text>
                    {t === 'Pro' && <SparklesIcon size={16} color={colors.brand[500]} style={{ marginLeft: spacing.sm }} />}
                  </View>
                  <Text style={styles.tierDescription}>
                    {t === 'Free' ? '10 uses/mo' : 'Unlimited uses'}
                  </Text>
                </View>
                {selectedTier === t && <CheckCircleIcon size={24} color={colors.brand[500]} />}
              </TouchableOpacity>
            </Animated.View>
          ))}
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
          onPress={handleGetStarted}
        >
          Get Started
        </PrimaryButton>
      </Animated.View>
    </View>
  );
}
