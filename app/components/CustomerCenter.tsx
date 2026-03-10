/**
 * RevenueCat Customer Center Component
 * 
 * Provides a native interface for users to manage their subscriptions,
 * including restoring purchases, viewing billing history, and canceling.
 */

import React, { useEffect, useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { X, Settings as SettingsIcon } from 'lucide-react-native';
import RevenueCatUI from 'react-native-purchases-ui';
import { colors, spacing, typography, radius } from '../lib/design-system';
import { isRevenueCatConfigured } from '../lib/revenuecat';

interface CustomerCenterProps {
  visible: boolean;
  onClose: () => void;
  onManageSubscription?: () => void;
}

export function CustomerCenter({
  visible,
  onClose,
  onManageSubscription,
}: CustomerCenterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePresentCustomerCenter = async () => {
    if (!isRevenueCatConfigured()) {
      setError('RevenueCat is not configured');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await RevenueCatUI.presentCustomerCenter();
      if (onManageSubscription) {
        onManageSubscription();
      }
      onClose();
    } catch (err: any) {
      console.error('[Customer Center] Error:', err);
      setError(err?.message || 'Failed to load subscription details');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-present customer center when modal becomes visible
  useEffect(() => {
    if (visible && !isLoading && !error && isRevenueCatConfigured()) {
      handlePresentCustomerCenter();
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Manage Subscription</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={24} color={colors.neutral[900]} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {isLoading && (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.brand[500]} />
              <Text style={styles.loadingText}>Loading subscription details...</Text>
            </View>
          )}

          {error && (
            <View style={styles.centered}>
              <SettingsIcon size={48} color={colors.error.default} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handlePresentCustomerCenter}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {!isLoading && !error && !isRevenueCatConfigured() && (
            <View style={styles.centered}>
              <SettingsIcon size={48} color={colors.neutral[400]} />
              <Text style={styles.errorText}>
                RevenueCat is not configured. Please check your API key.
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
    paddingBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  headerTitle: {
    ...typography.h2,
    color: colors.neutral[900],
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
    marginTop: spacing.sm,
    marginBottom: spacing.md,
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
