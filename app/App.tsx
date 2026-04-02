import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, Pressable, Modal, StyleSheet, Text, Animated, Easing, Alert, AppState, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { MapPinIcon, ExclamationCircleIcon, CheckIcon, HomeIcon as HomeOutlineIcon, Cog6ToothIcon as SettingsOutlineIcon } from 'react-native-heroicons/outline';
import { HomeIcon as HomeSolidIcon, Cog6ToothIcon as SettingsSolidIcon } from 'react-native-heroicons/solid';

import { Screen } from './components/Screen';
import { PrimaryButton } from './components/PrimaryButton';
import { StatusCard } from './components/StatusCard';
import { NavigationScreen } from './components/NavigationScreen';
import { Onboarding } from './components/Onboarding';
import { SettingsScreen } from './components/SettingsScreen';
import { RevenueCatPaywall } from './components/RevenueCatPaywall';
import { useParkingSpot } from './hooks/useParkingSpot';
import { useLocalUsageLimit } from './hooks/useLocalUsageLimit';
import { SubscriptionTier } from './types/parking';
import { storage } from './lib/storage';
import { BillingStatus, initializeRevenueCat, refreshBillingStatus } from './lib/revenuecat';
import { colors, spacing, typography, radius, layout, elevation } from './lib/design-system';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  screenContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeScreenContent: {
    backgroundColor: 'transparent',
  },
  gridBackground: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  gridLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  gridVerticalLine: {
    position: 'absolute',
    top: -spacing.xl,
    bottom: -spacing.xl,
    width: 1,
    backgroundColor: colors.neutral[200],
    opacity: 0.35,
  },
  gridHorizontalLine: {
    position: 'absolute',
    left: -spacing.xl,
    right: -spacing.xl,
    height: 1,
    backgroundColor: colors.neutral[200],
    opacity: 0.35,
  },
  emptyView: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  savedView: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  noSpotText: {
    ...typography.body,
    color: colors.neutral[500],
    marginBottom: spacing.huge,
  },
  errorText: {
    color: colors.warning.default,
    marginTop: spacing.xl,
    ...typography.small,
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  clearButtonText: {
    ...typography.body,
    color: colors.neutral[400],
  },
  clearButtonContainer: {
    flexDirection: 'column',
    gap: spacing.md,
    width: '100%',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    borderTopWidth: layout.borderWidth.thin,
    borderTopColor: colors.brand[600],
    backgroundColor: colors.brand[500],
  },
  navButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 1,
    paddingTop: 0,
    paddingBottom: 2,
    paddingHorizontal: spacing.md,
    flex: 1,
  },
  navButtonPressed: {
    transform: [{ scale: 1.08 }],
  },
  navIconWrap: {
    marginTop: 6,
  },
  navButtonText: {
    ...typography.label,
    fontSize: 9,
  },
  navButtonActive: {
    color: colors.neutral[0],
  },
  navButtonInactive: {
    color: colors.neutral[0],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: radius.xxl + spacing.sm,
    borderTopRightRadius: radius.xxl + spacing.sm,
    padding: spacing.lg,
    ...elevation.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.neutral[950],
  },
  closeButton: {
    padding: spacing.sm,
    backgroundColor: colors.neutral[100],
    borderRadius: radius.md,
  },
  modalText: {
    ...typography.body,
    color: colors.neutral[600],
    marginBottom: spacing.lg,
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
  },
  tierButtonActive: {
    borderColor: colors.brand[500],
    backgroundColor: colors.brand[50],
  },
  tierButtonText: {
    ...typography.bodyBold,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tierButtonSubtext: {
    ...typography.caption,
    color: colors.neutral[600],
  },
  debugButton: {
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.neutral[100],
  },
  debugButtonText: {
    ...typography.bodyBold,
    color: colors.neutral[600],
    textAlign: 'center',
  },
});

const ROUTE_CACHE_KEY = 'last_navigation_route';
const ROUTE_CACHE_TTL_MS = 1000 * 60 * 10;


export default function App() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navBarContentHeight = 48;
  const { spot, currentPos, distance, isSaving, error, saveSuccess, saveSpot, clearSpot } = useParkingSpot();
  const checkRevealAnim = useRef(new Animated.Value(0)).current;
  const buttonSuccessAnim = useRef(new Animated.Value(1)).current;
  const gridTranslateX = useRef(new Animated.Value(0)).current;
  const gridTranslateY = useRef(new Animated.Value(0)).current;
  const [showPaywall, setShowPaywall] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const [currentScreen, setCurrentScreen] = useState<'home' | 'settings' | 'navigation'>('home');
  const [billingStatus, setBillingStatus] = useState<BillingStatus>({
    enabled: false,
    isPro: false,
    renewsAtISO: null,
    expiresAtISO: null,
    willRenew: false,
    productIdentifier: null,
  });
  const { tier, usage, limit, decrementSession, updateTier } = useLocalUsageLimit(billingStatus.isPro);
  const [billingBusy, setBillingBusy] = useState(false);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);
  const screenTranslateX = useRef(new Animated.Value(0)).current;
  const [isScreenTransitioning, setIsScreenTransitioning] = useState(false);
  const [screenTransitionTarget, setScreenTransitionTarget] = useState<'home' | 'settings' | null>(null);

  useEffect(() => {
    const gridOffset = spacing.lg;
    const xLoop = Animated.loop(
      Animated.timing(gridTranslateX, {
        toValue: -gridOffset,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const yLoop = Animated.loop(
      Animated.timing(gridTranslateY, {
        toValue: -gridOffset,
        duration: 17000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    xLoop.start();
    yLoop.start();

    return () => {
      xLoop.stop();
      yLoop.stop();
    };
  }, [gridTranslateX, gridTranslateY]);

  useEffect(() => {
    storage.getItem('onboarding_complete').then(seen => {
      setHasSeenOnboarding(!!seen);
    });
  }, []);

  useEffect(() => {
    const loadBilling = async () => {
      try {
        const status = await initializeRevenueCat();
        setBillingStatus(status);
        if (status.enabled) {
          updateTier(status.isPro ? 'Pro' : 'Free');
        }
      } catch (billingError: any) {
        setBillingMessage(billingError?.message || 'Unable to load subscription status.');
      }
    };

    loadBilling();
  }, [updateTier]);

  useEffect(() => {
    if (saveSuccess) {
      checkRevealAnim.setValue(0);
      buttonSuccessAnim.setValue(1);
      
      // Trigger haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Animated.parallel([
        Animated.spring(checkRevealAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 8,
        }),
        Animated.sequence([
          Animated.spring(buttonSuccessAnim, {
            toValue: 1.08,
            useNativeDriver: true,
            tension: 100,
            friction: 7,
          }),
          Animated.spring(buttonSuccessAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 80,
            friction: 8,
          }),
        ]),
      ]).start();
      return;
    }

    checkRevealAnim.setValue(0);
    buttonSuccessAnim.setValue(1);
  }, [saveSuccess, checkRevealAnim, buttonSuccessAnim]);

  const checkScale = checkRevealAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  const checkOpacity = checkRevealAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0.8, 1],
  });

  const gridSize = spacing.xl + spacing.sm;
  const verticalLineCount = Math.ceil(windowWidth / gridSize) + 3;
  const horizontalLineCount = Math.ceil(windowHeight / gridSize) + 3;
  const verticalLines = Array.from({ length: verticalLineCount }, (_, index) => index);
  const horizontalLines = Array.from({ length: horizontalLineCount }, (_, index) => index);

  const navigateTo = (screen: 'home' | 'settings') => {
    if (currentScreen === screen || isScreenTransitioning) return;

    const direction = screen === 'settings' ? 1 : -1;
    setScreenTransitionTarget(screen);
    setIsScreenTransitioning(true);

    Animated.timing(screenTranslateX, {
      toValue: direction * -windowWidth,
      duration: 120,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start(() => {
      setCurrentScreen(screen);
      screenTranslateX.setValue(direction * windowWidth);

      Animated.timing(screenTranslateX, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }).start(() => {
        setIsScreenTransitioning(false);
        setScreenTransitionTarget(null);
      });
    });
  };

  const handleNavigate = async () => {
    if (!spot) return;

    const cachedRoute = await storage.getItem(ROUTE_CACHE_KEY) as {
      destination: { lat: number; lng: number };
      updatedAt: number;
    } | null;

    const canReuseCachedRoute =
      !!cachedRoute &&
      Date.now() - cachedRoute.updatedAt < ROUTE_CACHE_TTL_MS &&
      Math.abs(cachedRoute.destination.lat - spot.lat) < 0.0001 &&
      Math.abs(cachedRoute.destination.lng - spot.lng) < 0.0001;

    if (!canReuseCachedRoute && !decrementSession()) {
      setShowPaywall(true);
      return;
    }

    setCurrentScreen('navigation');
  };

  const handleOnboardingComplete = () => {
    setHasSeenOnboarding(true);
    storage.setItem('onboarding_complete', true);
  };

  const handleTierSelection = async (selectedTier: SubscriptionTier): Promise<boolean> => {
    setBillingMessage(null);

    if (selectedTier === 'Free') {
      if (billingStatus.isPro) {
        const endDate = billingStatus.expiresAtISO
          ? new Date(billingStatus.expiresAtISO).toLocaleDateString()
          : null;

        Alert.alert(
          'Cancel subscription to switch plans',
          endDate
            ? `You currently have an active Pro subscription. Cancel it in Manage Subscription. You will keep Pro access until ${endDate}.`
            : 'You currently have an active Pro subscription. Cancel it in Manage Subscription. You will keep Pro access until the current billing period ends.',
          [
            {
              text: 'Open Settings',
              onPress: () => setCurrentScreen('settings'),
            },
            {
              text: 'OK',
              style: 'cancel',
            },
          ]
        );
        return false;
      }

      updateTier('Free');
      return true;
    }

    if (selectedTier === 'Pro') {
      if (billingStatus.isPro) {
        return true;
      }

      setShowPaywall(true);
      return false;
    }

    updateTier(selectedTier);
    return true;
  };

  const handlePurchaseCompleted = async () => {
    console.log('[App] Purchase completed, refreshing billing status...');
    
    // Refresh billing status after purchase with retry for entitlement sync
    const maxRetries = 3;
    let attempt = 0;
    let status: BillingStatus | null = null;
    
    while (attempt < maxRetries) {
      status = await refreshBilling();
      console.log('[App] Billing refresh attempt', attempt + 1, '- isPro:', status?.isPro);
      
      if (status?.isPro) {
        console.log('[App] Pro entitlement confirmed!');
        break;
      }
      
      // Wait a bit for RevenueCat to sync entitlements
      if (attempt < maxRetries - 1) {
        console.log('[App] Entitlement not yet synced, waiting...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      attempt++;
    }
    
    if (!status?.isPro) {
      console.warn('[App] Purchase completed but Pro entitlement not found after retries');
    }
    
    console.log('[App] Final billing status - isPro:', status?.isPro, 'In onboarding?', !hasSeenOnboarding);
    
    // If we're in onboarding, close paywall and complete onboarding
    if (!hasSeenOnboarding) {
      console.log('[App] Completing onboarding after purchase');
      setShowPaywall(false);
      handleOnboardingComplete();
    } else {
      console.log('[App] Purchase completed in main app, closing paywall');
      // If we're in the main app, just close the paywall
      setShowPaywall(false);
    }
  };

  const refreshBilling = async (): Promise<BillingStatus | null> => {
    try {
      const latest = await refreshBillingStatus();
      console.log('[App] Billing status:', {
        enabled: latest.enabled,
        isPro: latest.isPro,
        productIdentifier: latest.productIdentifier,
        willRenew: latest.willRenew,
      });
      
      setBillingStatus(latest);
      if (latest.enabled) {
        const newTier = latest.isPro ? 'Pro' : 'Free';
        console.log('[App] Updating tier to:', newTier);
        updateTier(newTier);
      }
      return latest;
    } catch (error) {
      console.error('[App] Failed to refresh billing:', error);
      return null;
    }
  };

  useEffect(() => {
    refreshBilling();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshBilling();
      }
    });

    return () => subscription.remove();
  }, []);

  if (hasSeenOnboarding === null) {
    return null; // Loading state
  }

  if (!hasSeenOnboarding) {
    return (
      <>
        <Onboarding onComplete={handleOnboardingComplete} onSelectTier={handleTierSelection} />
        <RevenueCatPaywall
          visible={showPaywall}
          onClose={() => setShowPaywall(false)}
          onPurchaseCompleted={handlePurchaseCompleted}
          onRestoreCompleted={handlePurchaseCompleted}
          requiredEntitlementIdentifier="Parker Pro"
        />
      </>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.neutral[50] }}>
      {currentScreen === 'home' && (
        <View pointerEvents="none" style={styles.gridBackground}>
          <Animated.View
            style={[
              styles.gridLayer,
              {
                transform: [
                  { translateX: gridTranslateX },
                  { translateY: gridTranslateY },
                ],
              },
            ]}
          >
            {verticalLines.map((line) => (
              <View
                key={`v-${line}`}
                style={[styles.gridVerticalLine, { left: line * gridSize }]}
              />
            ))}
            {horizontalLines.map((line) => (
              <View
                key={`h-${line}`}
                style={[styles.gridHorizontalLine, { top: line * gridSize }]}
              />
            ))}
          </Animated.View>
        </View>
      )}

      <Screen 
        fullWidth={currentScreen === 'home' || currentScreen === 'settings' || currentScreen === 'navigation'}
        noPadding={currentScreen === 'home' || currentScreen === 'navigation'}
        noBottomPadding={currentScreen === 'navigation'}
        safeAreaEdges={currentScreen === 'navigation' ? ['top', 'left', 'right'] : undefined}
      >
        <View style={styles.container}>
          {/* Main Content Area */}
          <View style={styles.contentContainer}>
            <Animated.View style={{ flex: 1, transform: [{ translateX: screenTranslateX }] }}>
            {currentScreen === 'home' ? (
              <View style={[styles.screenContent, styles.homeScreenContent]}>
                {!spot ? (
                  <View style={styles.emptyView}>
                    <Text style={styles.noSpotText}>No parking spot saved</Text>
                    
                    <PrimaryButton 
                      variant="circle"
                      color={saveSuccess ? 'success' : 'brand'}
                      onPress={saveSpot}
                      isLoading={isSaving}
                      successScale={buttonSuccessAnim}
                      icon={
                        saveSuccess ? (
                          <Animated.View
                            style={{
                              opacity: checkOpacity,
                              transform: [{ scale: checkScale }],
                            }}
                          >
                            <CheckIcon size={64} color={colors.neutral[0]} strokeWidth={3.5} />
                          </Animated.View>
                        ) : (
                          <MapPinIcon size={56} color={colors.neutral[0]} strokeWidth={1.5} />
                        )
                      }
                    >
                      {saveSuccess ? "Saved!" : "Save Parking Spot"}
                    </PrimaryButton>

                    {error && (
                      <View style={styles.errorText}>
                        <ExclamationCircleIcon size={16} color={colors.warning.default} />
                        <Text style={{ color: colors.warning.default, marginLeft: spacing.xs }}>{error}</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.savedView}>
                    <StatusCard spot={spot} distance={distance} />

                    <PrimaryButton 
                      onPress={handleNavigate}
                    >
                      Take Me To My Car
                    </PrimaryButton>

                    <View style={styles.clearButtonContainer}>
                      <TouchableOpacity 
                        style={styles.clearButton}
                        onPress={clearSpot}
                      >
                        <Text style={styles.clearButtonText}>Clear Parking Spot</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            ) : currentScreen === 'navigation' && spot ? (
              <NavigationScreen
                currentPos={currentPos}
                destination={{ lat: spot.lat, lng: spot.lng }}
                onBack={() => setCurrentScreen('home')}
              />
            ) : (
              <SettingsScreen 
                tier={tier}
                usage={usage}
                limit={limit}
                updateTier={handleTierSelection}
                billingStatus={billingStatus}
                billingBusy={billingBusy}
                billingMessage={billingMessage}
                onRefreshBilling={async () => {
                  await refreshBilling();
                }}
              />
            )}
            </Animated.View>
          </View>
        </View>
      </Screen>

      {/* Bottom Nav Bar - Fixed at bottom (hidden in navigation mode) */}
      {currentScreen !== 'navigation' && (
        <View
          style={[
            styles.bottomBar,
            {
              height: navBarContentHeight + insets.bottom,
              paddingTop: spacing.xs,
              paddingBottom: Math.max(insets.bottom - 5, spacing.sm),
            },
          ]}
        >
          <Pressable
            style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}
            onPress={() => navigateTo('home')}
          >
            {({ pressed }) => (
              <>
                <View style={styles.navIconWrap}>
                  {currentScreen === 'home' || screenTransitionTarget === 'home' || pressed ? (
                    <HomeSolidIcon size={22} color={colors.neutral[0]} />
                  ) : (
                    <HomeOutlineIcon size={22} color={colors.neutral[0]} strokeWidth={1.6} />
                  )}
                </View>
                <Text style={[styles.navButtonText, currentScreen === 'home' ? styles.navButtonActive : styles.navButtonInactive]}>Home</Text>
              </>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}
            onPress={() => navigateTo('settings')}
          >
            {({ pressed }) => (
              <>
                <View style={styles.navIconWrap}>
                  {currentScreen === 'settings' || screenTransitionTarget === 'settings' || pressed ? (
                    <SettingsSolidIcon size={22} color={colors.neutral[0]} />
                  ) : (
                    <SettingsOutlineIcon size={22} color={colors.neutral[0]} strokeWidth={1.6} />
                  )}
                </View>
                <Text style={[styles.navButtonText, currentScreen === 'settings' ? styles.navButtonActive : styles.navButtonInactive]}>Settings</Text>
              </>
            )}
          </Pressable>
        </View>
      )}

      {/* RevenueCat Paywall Modal */}
      <RevenueCatPaywall
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onPurchaseCompleted={handlePurchaseCompleted}
        onRestoreCompleted={handlePurchaseCompleted}
        requiredEntitlementIdentifier="Parker Pro"
      />
    </View>
  );
  }
