import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Path, Defs, Pattern, Rect, Circle, Stop, Mask as SvgMask, G, RadialGradient } from 'react-native-svg';
import { colors, radius } from '../lib/design-system';

// Create animated SVG components
const AnimatedPath = Animated.createAnimatedComponent(Path);

export function MapVisualization() {
  const pathProgress = useRef(new Animated.Value(0)).current;
  const pinScale = useRef(new Animated.Value(0)).current;
  const pinY = useRef(new Animated.Value(-20)).current;
  const pinOpacity = useRef(new Animated.Value(0)).current;

  const PATH_LENGTH = 225;

  useEffect(() => {
    pathProgress.setValue(0);
    pinScale.setValue(0);
    pinY.setValue(-20);
    pinOpacity.setValue(0);

    Animated.timing(pathProgress, {
      toValue: PATH_LENGTH,
      duration: 2000,
      delay: 200,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();

    const pinTimer = setTimeout(() => {
      Animated.parallel([
        Animated.spring(pinScale, {
          toValue: 1,
          damping: 18,
          stiffness: 220,
          mass: 0.9,
          useNativeDriver: true,
        }),
        Animated.spring(pinY, {
          toValue: 0,
          damping: 20,
          stiffness: 220,
          mass: 1,
          useNativeDriver: true,
        }),
        Animated.timing(pinOpacity, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }, 1800);

    return () => clearTimeout(pinTimer);
  }, []);

  const strokeDashoffset = pathProgress.interpolate({
    inputRange: [0, PATH_LENGTH],
    outputRange: [PATH_LENGTH, 0],
  });

  return (
    <View style={styles.container}>
      {/* SVG Map Background */}
      <Svg viewBox="0 0 300 300" style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
            <Path d="M 25 0 L 0 0 0 25" fill="none" stroke="#E5E5EA" strokeWidth="1" />
          </Pattern>

          <RadialGradient id="radialFade" cx="150" cy="150" r="150" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="white" stopOpacity="1" />
            <Stop offset="62%" stopColor="white" stopOpacity="1" />
            <Stop offset="100%" stopColor="black" stopOpacity="1" />
          </RadialGradient>

          <SvgMask id="radialFadeMask" x="0" y="0" width="300" height="300">
            <Rect x="0" y="0" width="300" height="300" fill="url(#radialFade)" />
          </SvgMask>
          
          {/* Mask for progressive line drawing */}
          <SvgMask id="lineMask">
            <AnimatedPath
              d="M 75 300 L 75 225 L 150 225 L 150 150"
              fill="none"
              stroke="white"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={PATH_LENGTH}
              strokeDashoffset={strokeDashoffset}
            />
          </SvgMask>
        </Defs>

        <G mask="url(#radialFadeMask)">
          <Rect width="100%" height="100%" fill={colors.neutral[50]} />
          <Rect x="0" y="0" width="300" height="300" fill="url(#grid)" />

          <Path d="M 0 75 L 300 75" fill="none" stroke="#F3F4F6" strokeWidth="16" />
          <Path d="M 0 150 L 300 150" fill="none" stroke="#F3F4F6" strokeWidth="16" />
          <Path d="M 0 225 L 300 225" fill="none" stroke="#F3F4F6" strokeWidth="16" />
          <Path d="M 75 0 L 75 300" fill="none" stroke="#F3F4F6" strokeWidth="16" />
          <Path d="M 150 0 L 150 300" fill="none" stroke="#F3F4F6" strokeWidth="16" />
          <Path d="M 225 0 L 225 300" fill="none" stroke="#F3F4F6" strokeWidth="16" />

          <Path
            d="M 75 300 L 75 225 L 150 225 L 150 150"
            fill="none"
            stroke="#6B7280"
            strokeWidth="5"
            strokeDasharray="1 14"
            strokeLinecap="round"
            strokeLinejoin="round"
            mask="url(#lineMask)"
          />
        </G>
      </Svg>

      {/* Animated Pin */}
      <Animated.View
        style={[
          styles.pinContainer,
          {
            transform: [
              { translateY: pinY },
              { scale: pinScale },
            ],
            opacity: pinOpacity,
          },
        ]}
      >
        <Svg width="48" height="48" viewBox="2 2 20 20" fill="none">
          <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" fill="#EF4444" />
          <Circle cx="12" cy="10" r="4" fill="#991B1B" />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  pinContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -24,
    marginTop: -48,
  },
});
