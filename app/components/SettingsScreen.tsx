import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Crown, CheckCircle2, Bell, Shield, CircleHelp, LogOut, RefreshCw, Settings as SettingsIcon } from 'lucide-react-native';
import { SubscriptionTier, UsageData } from '../types/parking';
import { colors, spacing, typography, radius, layout } from '../lib/design-system';
import { BillingStatus, restorePurchases } from '../lib/revenuecat';
import { CustomerCenter } from './CustomerCenter';

interface SettingsScreenProps {
  tier: SubscriptionTier;
  usage: UsageData;
  limit: number;
  updateTier: (tier: SubscriptionTier) => Promise<boolean | void> | void;
  onRestartOnboarding: () => void;
  billingStatus: BillingStatus;
  billingBusy: boolean;
  billingMessage: string | null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    paddingHorizontal: 0,
  },
  header: {
    ...typography.h1,
    color: colors.neutral[950],
    marginBottom: spacing.xl,
  },
  sectionContainer: {
    width: '100%',
    alignSelf: 'stretch',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.neutral[500],
    marginBottom: spacing.sm,
    marginLeft: 0,
  },
  card: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: colors.neutral[0],
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: layout.borderWidth.thin,
    borderColor: colors.neutral[200],
  },
  usageSection: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: layout.borderWidth.thin,
    borderBottomColor: colors.neutral[200],
  },
  usageLabel: {
    ...typography.small,
    color: colors.neutral[500],
    marginBottom: spacing.xs,
  },
  usageText: {
    ...typography.bodyBold,
    color: colors.neutral[950],
  },
  renewalText: {
    ...typography.small,
    color: colors.neutral[600],
    marginTop: spacing.xs,
  },
  billingMessage: {
    ...typography.small,
    color: colors.warning.default,
    marginTop: spacing.xs,
  },
  tierButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 56,
    borderBottomWidth: layout.borderWidth.thin,
    borderBottomColor: colors.neutral[200],
  },
  tierButtonLast: {
    borderBottomWidth: 0,
  },
  restoreButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.neutral[50],
    borderWidth: layout.borderWidth.thin,
    borderColor: colors.brand[200],
  },
  restoreButtonText: {
    ...typography.caption,
    color: colors.brand[600],
  },
  restoreButtonTextDisabled: {
    color: colors.neutral[400],
  },
  tierContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tierIcon: {
    width: 28,
    height: 28,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tierInfo: {
    gap: 0,
  },
  tierName: {
    ...typography.captionBold,
    color: colors.neutral[950],
  },
  tierDesc: {
    ...typography.small,
    color: colors.neutral[500],
  },
  settingButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 56,
    borderBottomWidth: layout.borderWidth.thin,
    borderBottomColor: colors.neutral[200],
  },
  settingButtonLast: {
    borderBottomWidth: 0,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  settingLabel: {
    ...typography.body,
    color: colors.neutral[950],
  },
  version: {
    textAlign: 'center',
    ...typography.small,
    color: colors.neutral[400],
    marginBottom: spacing.xl,
    marginTop: spacing.lg,
  },
});

export function SettingsScreen({
  tier,
  usage,
  limit,
  updateTier,
  onRestartOnboarding,
  billingStatus,
  billingBusy,
  billingMessage,
}: SettingsScreenProps) {
  const availableTiers = ['Free', 'Pro'] as SubscriptionTier[];
  const renewalDateLabel = billingStatus.renewsAtISO
    ? new Date(billingStatus.renewsAtISO).toLocaleDateString()
    : null;
  const expiresDateLabel = billingStatus.expiresAtISO
    ? new Date(billingStatus.expiresAtISO).toLocaleDateString()
    : null;
  
  const [showCustomerCenter, setShowCustomerCenter] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestorePurchases = async () => {
    setIsRestoring(true);
    try {
      const result = await restorePurchases();
      if (result.isPro) {
        Alert.alert(
          'Success',
          'Your purchases have been restored!',
          [{ text: 'OK' }]
        );
        // Trigger tier update
        await updateTier('Pro');
      } else {
        Alert.alert(
          'No Purchases Found',
          'We couldn\'t find any purchases to restore.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Restore Failed',
        error.message || 'Failed to restore purchases. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.header}>Settings</Text>

      {/* Subscription Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Subscription & Usage</Text>
        <View style={styles.card}>
          <View style={styles.usageSection}>
            <Text style={styles.usageLabel}>Current Usage</Text>
            <Text style={styles.usageText}>
              {tier === 'Pro' ? 'Unlimited' : `${usage.count} of ${limit === Infinity ? 'Unlimited' : limit} navigations`}
            </Text>
            {tier === 'Pro' && billingStatus.enabled ? (
              <Text style={styles.renewalText}>
                {billingStatus.willRenew
                  ? renewalDateLabel
                    ? `Renews: ${renewalDateLabel}`
                    : 'Renewal date unavailable'
                  : expiresDateLabel
                    ? `Subscription cancelled. Pro access ends on ${expiresDateLabel}`
                    : 'Subscription cancelled. Pro access remains until period end.'}
              </Text>
            ) : null}
            {tier === 'Pro' && !billingStatus.enabled ? (
              <Text style={styles.renewalText}>RevenueCat not configured yet.</Text>
            ) : null}
            {billingMessage ? <Text style={styles.billingMessage}>{billingMessage}</Text> : null}
          </View>

          {availableTiers.map((t, idx) => (
            <TouchableOpacity
              key={t}
              style={[styles.tierButton, idx === availableTiers.length - 1 && styles.tierButtonLast]}
              onPress={() => updateTier(t)}
              disabled={billingBusy}
              activeOpacity={0.7}
            >
              <View style={styles.tierContent}>
                <View style={styles.tierIcon}>
                  {t === 'Pro' ? (
                    <Crown size={16} color={colors.brand[500]} />
                  ) : (
                    <CheckCircle2 size={16} color={colors.neutral[500]} />
                  )}
                </View>
                <View style={styles.tierInfo}>
                  <Text style={styles.tierName}>{t}</Text>
                  <Text style={styles.tierDesc}>
                    {t === 'Free' ? '10 uses/mo' : 'Unlimited uses'}
                  </Text>
                </View>
              </View>
              {tier === t && <CheckCircle2 size={20} color={colors.brand[500]} />}
            </TouchableOpacity>
          ))}
          
          {/* Restore Purchases Button - Only show if Pro but billing not enabled */}
          {tier === 'Pro' && billingStatus.enabled && (
            <TouchableOpacity
              style={[styles.restoreButton]}
              onPress={() => setShowCustomerCenter(true)}
              activeOpacity={0.7}
            >
              <SettingsIcon size={16} color={colors.brand[600]} />
              <Text style={styles.restoreButtonText}>Manage Subscription</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.restoreButton]}
            onPress={handleRestorePurchases}
            disabled={isRestoring}
            activeOpacity={0.7}
          >
            <RefreshCw size={16} color={isRestoring ? colors.neutral[400] : colors.brand[600]} />
            <Text style={[styles.restoreButtonText, isRestoring && styles.restoreButtonTextDisabled]}>
              {isRestoring ? 'Restoring...' : 'Restore Purchases'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Preferences Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.settingButton} activeOpacity={0.7}>
            <View style={styles.settingContent}>
              <Bell size={18} color={colors.info.default} />
              <Text style={styles.settingLabel}>Notifications</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingButton} activeOpacity={0.7}>
            <View style={styles.settingContent}>
              <Shield size={18} color={colors.success.default} />
              <Text style={styles.settingLabel}>Privacy & Location</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.settingButton, styles.settingButtonLast]} activeOpacity={0.7}>
            <View style={styles.settingContent}>
              <CircleHelp size={18} color={colors.brand[600]} />
              <Text style={styles.settingLabel}>Help & Support</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Advanced Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Advanced</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={[styles.settingButton, styles.settingButtonLast]}
            onPress={onRestartOnboarding}
            activeOpacity={0.7}
          >
            <View style={styles.settingContent}>
              <LogOut size={18} color={colors.neutral[600]} />
              <Text style={styles.settingLabel}>Restart Onboarding</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.version}>Parker App v1.0.0</Text>
      
      {/* Customer Center Modal */}
      <CustomerCenter
        visible={showCustomerCenter}
        onClose={() => setShowCustomerCenter(false)}
        onManageSubscription={() => {
          // Refresh billing status after managing subscription
          setShowCustomerCenter(false);
        }}
      />
    </ScrollView>
  );
}
