import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, Modal, StyleSheet, Text, Animated, Easing, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { MapPin, Settings, Info, X, Crown, Zap, CheckCircle2, AlertCircle, Check, Home } from 'lucide-react-native';

import { Screen } from './components/Screen';
import { PrimaryButton } from './components/PrimaryButton';
import { StatusCard } from './components/StatusCard';
import { NavigationScreen } from './components/NavigationScreen';
import { Onboarding } from './components/Onboarding';
import { SettingsScreen } from './components/SettingsScreen';
import { RevenueCatPaywall } from './components/RevenueCatPaywall';
import { useParkingSpot } from './hooks/useParkingSpot';
import { useNavigationLimit } from './hooks/useNavigationLimit';
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
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderTopWidth: layout.borderWidth.thin,
    borderTopColor: colors.neutral[200],
    backgroundColor: colors.neutral[0],
  },
  navButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flex: 1,
  },
  navButtonText: {
    ...typography.label,
    fontSize: 10,
  },
  navButtonActive: {
    color: colors.brand[500],
  },
  navButtonInactive: {
    color: colors.neutral[500],
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


export default function App() {
  const { spot, currentPos, distance, isSaving, error, saveSuccess, saveSpot, clearSpot } = useParkingSpot();
  const { tier, usage, limit, decrementSession, updateTier } = useNavigationLimit();
  const checkRevealAnim = useRef(new Animated.Value(0)).current;
  const buttonSuccessAnim = useRef(new Animated.Value(1)).current;
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
  const [billingBusy, setBillingBusy] = useState(false);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);

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

  const handleNavigate = () => {
    if (!spot) return;
    
    if (!decrementSession()) {
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
      <Screen 
        fullWidth={currentScreen === 'settings' || currentScreen === 'navigation'}
        noPadding={currentScreen === 'navigation'}
      >
        <View style={styles.container}>
          {/* Main Content Area */}
          <View style={styles.contentContainer}>
            {currentScreen === 'home' ? (
              <View style={styles.screenContent}>
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
                            <Check size={64} color={colors.neutral[0]} strokeWidth={3.5} />
                          </Animated.View>
                        ) : (
                          <MapPin size={56} color={colors.neutral[0]} strokeWidth={1.5} />
                        )
                      }
                    >
                      {saveSuccess ? "Saved!" : "Save Parking Spot"}
                    </PrimaryButton>

                    {error && (
                      <View style={styles.errorText}>
                        <AlertCircle size={16} color={colors.warning.default} />
                        <Text style={{ color: colors.warning.default, marginLeft: spacing.xs }}>{error}</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.savedView}>
                    <StatusCard spot={spot} distance={distance} />

                    <PrimaryButton 
                      onPress={handleNavigate}
                      icon={<MapPin size={20} color={colors.neutral[0]} />}
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
                onRestartOnboarding={() => {
                  storage.removeItem('onboarding_complete');
                  setHasSeenOnboarding(false);
                  setCurrentScreen('home');
                }}
              />
            )}
          </View>
        </View>
      </Screen>

      {/* Bottom Nav Bar - Fixed at bottom (hidden in navigation mode) */}
      {currentScreen !== 'navigation' && (
        <SafeAreaView style={styles.bottomBar}>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => setCurrentScreen('home')}
          >
            <Home size={24} color={currentScreen === 'home' ? colors.brand[500] : colors.neutral[500]} strokeWidth={currentScreen === 'home' ? 2 : 1.5} />
            <Text style={[styles.navButtonText, currentScreen === 'home' ? styles.navButtonActive : styles.navButtonInactive]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => setCurrentScreen('settings')}
          >
            <Settings size={24} color={currentScreen === 'settings' ? colors.brand[500] : colors.neutral[500]} strokeWidth={currentScreen === 'settings' ? 2 : 1.5} />
            <Text style={[styles.navButtonText, currentScreen === 'settings' ? styles.navButtonActive : styles.navButtonInactive]}>Settings</Text>
          </TouchableOpacity>
        </SafeAreaView>
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
