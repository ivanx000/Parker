/**
 * RevenueCat Paywall Component
 * 
 * Uses RevenueCat's native Paywall UI with automatic package display,
 * localization, and purchase handling.
 */

import React, { useEffect, useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Platform
} from 'react-native';
import { X } from 'lucide-react-native';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import Purchases from 'react-native-purchases';
import { colors, spacing, typography, radius } from '../lib/design-system';
import { isRevenueCatConfigured, purchasePro } from '../lib/revenuecat';

interface RevenueCatPaywallProps {
  visible: boolean;
  onClose: () => void;
  onPurchaseCompleted?: () => void;
  onRestoreCompleted?: () => void;
  requiredEntitlementIdentifier?: string;
}

export function RevenueCatPaywall({
  visible,
  onClose,
  onPurchaseCompleted,
  onRestoreCompleted,
  requiredEntitlementIdentifier = 'Parker Pro',
}: RevenueCatPaywallProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configuredOfferingId = process.env.EXPO_PUBLIC_RC_OFFERING_ID;

  useEffect(() => {
    if (visible && !isRevenueCatConfigured()) {
      setError('RevenueCat is not properly configured. Please check your API key.');
    }
  }, [visible]);

  const handlePresentPaywall = async () => {
    if (!isRevenueCatConfigured()) {
      setError('RevenueCat is not configured');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let offeringForPaywall: any = undefined;

      if (configuredOfferingId) {
        const offerings = await Purchases.getOfferings();
        offeringForPaywall = offerings.all?.[configuredOfferingId];

        if (!offeringForPaywall) {
          const caseInsensitiveKey = Object.keys(offerings.all ?? {}).find(
            (key) => key.toLowerCase() === configuredOfferingId.toLowerCase()
          );

          if (caseInsensitiveKey) {
            offeringForPaywall = offerings.all?.[caseInsensitiveKey];
          }
        }

        if (!offeringForPaywall) {
          throw new Error(
            `RevenueCat offering "${configuredOfferingId}" was not found. Check exact offering identifier casing in dashboard.`
          );
        }
      }

      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier,
        offering: offeringForPaywall,
      });

      console.log('[Paywall] Result:', result);

      if (result === PAYWALL_RESULT.PURCHASED) {
        console.log('[Paywall] Purchase completed successfully');
        if (onPurchaseCompleted) {
          try {
            await onPurchaseCompleted();
          } catch (error) {
            console.error('[Paywall] Error in purchase completed callback:', error);
          }
        }
        onClose();
        return;
      }

      if (result === PAYWALL_RESULT.RESTORED) {
        console.log('[Paywall] Purchases restored successfully');
        if (onRestoreCompleted) {
          try {
            await onRestoreCompleted();
          } catch (error) {
            console.error('[Paywall] Error in restore completed callback:', error);
          }
        }
        onClose();
        return;
      }

      if (result === PAYWALL_RESULT.CANCELLED) {
        console.log('[Paywall] User cancelled purchase');
        onClose();
        return;
      }

      if (result === PAYWALL_RESULT.NOT_PRESENTED) {
        console.log('[Paywall] Paywall not presented - user already has entitlement');
        onClose();
        return;
      }

      if (result === PAYWALL_RESULT.ERROR) {
        console.error('[Paywall] Paywall returned error result');
        setError('Unable to complete purchase. Please try again.');
      }
    } catch (err: any) {
      console.error('[Paywall] Error:', err);
      const message = String(err?.message || '');
      const isBrowserPreviewError =
        message.includes('document is not available') ||
        message.includes('browser environment');

      if (isBrowserPreviewError) {
        try {
          const purchaseStatus = await purchasePro();
          if (purchaseStatus?.isPro && onPurchaseCompleted) {
            onPurchaseCompleted();
          }
          onClose();
          return;
        } catch (fallbackError: any) {
          setError(
            fallbackError?.message ||
              'Native paywall UI is unavailable in this build. Use a development or production native build to show RevenueCat paywalls.'
          );
          return;
        }
      }

      setError(err?.message || 'Failed to present paywall');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-present paywall when modal becomes visible
  useEffect(() => {
    if (visible && !isLoading && !error) {
      handlePresentPaywall();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header with close button */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={24} color={colors.neutral[900]} />
          </TouchableOpacity>
        </View>

        {/* Loading or error state */}
        <View style={styles.content}>
          {isLoading && (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.brand[500]} />
              <Text style={styles.loadingText}>Loading subscription options...</Text>
            </View>
          )}

          {error && (
            <View style={styles.centered}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handlePresentPaywall}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {!isLoading && !error && (
            <View style={styles.centered}>
              <Text style={styles.infoText}>
                The paywall should appear automatically.
              </Text>
              <Text style={styles.subInfoText}>
                If it doesn't, please close and try again.
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? spacing.xl : spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  centered: {
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.neutral[600],
    marginTop: spacing.sm,
  },
  errorText: {
    ...typography.body,
    color: colors.error.dark,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  infoText: {
    ...typography.body,
    color: colors.neutral[700],
    textAlign: 'center',
  },
  subInfoText: {
    ...typography.caption,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.brand[500],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  retryButtonText: {
    ...typography.bodyBold,
    color: colors.neutral[0],
  },
});
