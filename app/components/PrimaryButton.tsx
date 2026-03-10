import React, { useRef } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { colors, spacing, typography, elevation, radius, opacity } from '../lib/design-system';

interface PrimaryButtonProps {
  onPress?: () => void;
  icon?: React.ReactNode;
  isLoading?: boolean;
  variant?: 'default' | 'circle';
  color?: 'brand' | 'success';
  children: React.ReactNode;
  disabled?: boolean;
  successScale?: Animated.Value;
}

const styles = StyleSheet.create({
  circleButton: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.brand[500],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 24,
  },
  defaultButton: {
    width: '100%',
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.brand[500],
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...elevation.brand,
  },
  buttonContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    flexDirection: 'column',
  },
  defaultButtonContent: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  text: {
    color: colors.neutral[0],
    ...typography.button,
  },
  disabledButton: {
    opacity: opacity.disabled,
  },
  successButton: {
    backgroundColor: colors.success.default,
  },
});

export function PrimaryButton({
  children,
  icon,
  isLoading = false,
  variant = 'default',
  color = 'brand',
  disabled = false,
  successScale,
  onPress,
}: PrimaryButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const buttonStyle = variant === 'circle' ? styles.circleButton : styles.defaultButton;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      friction: 8,
      tension: 300,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 300,
    }).start();
  };

  const combinedScale = successScale 
    ? Animated.multiply(scaleAnim, successScale)
    : scaleAnim;
  const isCircle = variant === 'circle';

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || isLoading}
      activeOpacity={1}
      style={!isCircle ? { width: '100%' } : undefined}
    >
      <Animated.View 
        style={[
          buttonStyle, 
          color === 'success' && styles.successButton,
          disabled && styles.disabledButton,
          {
            transform: [{ scale: combinedScale }],
          },
        ]}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.neutral[0]} />
        ) : (
          isCircle ? (
            <View style={styles.buttonContent}>
              {icon}
              {typeof children === 'string' ? (
                <Text style={styles.text}>{children}</Text>
              ) : (
                children
              )}
            </View>
          ) : (
            <View style={styles.defaultButtonContent}>
              {icon}
              {typeof children === 'string' ? (
                <Text style={styles.text}>{children}</Text>
              ) : (
                children
              )}
            </View>
          )
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}
