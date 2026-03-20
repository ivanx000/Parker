import React, { useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Animated, Easing, useWindowDimensions, Linking } from 'react-native';
import { SparklesIcon, CheckCircleIcon as CheckCircleSolidIcon } from 'react-native-heroicons/solid';
import { MinusCircleIcon, BellIcon, ShieldCheckIcon, QuestionMarkCircleIcon, ArrowPathIcon, Cog6ToothIcon as SettingsIcon, ArrowLeftIcon, ChevronRightIcon, ChevronDownIcon } from 'react-native-heroicons/outline';
import { SubscriptionTier, UsageData } from '../types/parking';
import { colors, spacing, typography, radius, layout } from '../lib/design-system';
import RevenueCatUI from 'react-native-purchases-ui';
import { BillingStatus, restorePurchases } from '../lib/revenuecat';
import { getLocationPermissionStatus, openAppPermissionSettings, requestLocationPermission } from '../lib/location';

interface SettingsScreenProps {
  tier: SubscriptionTier;
  usage: UsageData;
  limit: number;
  updateTier: (tier: SubscriptionTier) => Promise<boolean | void> | void;
  onRefreshBilling: () => Promise<void>;
  billingStatus: BillingStatus;
  billingBusy: boolean;
  billingMessage: string | null;
}

type PreferenceSection = 'notifications' | 'privacy' | 'help' | 'restore' | null;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    paddingHorizontal: 0,
  },
  header: {
    ...typography.h1,
    color: colors.neutral[950],
  },
  titleRow: {
    minHeight: 40,
    justifyContent: 'center',
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
  helperText: {
    ...typography.small,
    color: colors.neutral[600],
    marginBottom: spacing.md,
  },
  faqItem: {
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    minHeight: 58,
    backgroundColor: colors.brand[50],
  },
  faqItemExpanded: {
    paddingVertical: spacing.md,
    minHeight: 120,
  },
  faqHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  faqQuestion: {
    ...typography.captionBold,
    color: colors.brand[700],
    marginBottom: spacing.xs,
    flex: 1,
  },
  faqAnswer: {
    ...typography.body,
    color: colors.neutral[700],
    marginTop: spacing.xs,
  },
  faqTitle: {
    ...typography.h2,
    color: colors.neutral[950],
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.label,
    color: colors.neutral[700],
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.neutral[950],
    backgroundColor: colors.neutral[100],
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: spacing.md,
    backgroundColor: colors.brand[500],
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  submitButtonDisabled: {
    backgroundColor: colors.neutral[300],
  },
  submitButtonText: {
    ...typography.bodyBold,
    color: colors.neutral[0],
  },
  askTitle: {
    ...typography.h2,
    color: colors.neutral[950],
    marginBottom: spacing.xs,
  },
  pager: {
    flexDirection: 'row',
  },
  page: {
    paddingHorizontal: spacing.md,
  },
  detailPage: {
    paddingHorizontal: spacing.md,
  },
  tierSelectedIndicator: {
    marginRight: spacing.sm,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[0],
    borderWidth: layout.borderWidth.thin,
    borderColor: colors.neutral[200],
  },
  detailTitle: {
    ...typography.h1,
    color: colors.neutral[950],
    flexShrink: 1,
  },
  detailCard: {
    width: '100%',
    backgroundColor: 'transparent',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  detailParagraph: {
    ...typography.body,
    color: colors.neutral[700],
    marginBottom: spacing.sm,
  },
  inlineStatus: {
    ...typography.small,
    color: colors.brand[600],
    marginTop: spacing.sm,
  },
  preferencePrimaryButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.brand[500],
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  preferencePrimaryButtonText: {
    ...typography.bodyBold,
    color: colors.neutral[0],
    textAlign: 'center',
  },
});

export function SettingsScreen({
  tier,
  usage,
  limit,
  updateTier,
  onRefreshBilling,
  billingStatus,
  billingBusy,
  billingMessage,
}: SettingsScreenProps) {
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const availableTiers = ['Free', 'Pro'] as SubscriptionTier[];
  const renewalDateLabel = billingStatus.renewsAtISO
    ? new Date(billingStatus.renewsAtISO).toLocaleDateString()
    : null;
  const expiresDateLabel = billingStatus.expiresAtISO
    ? new Date(billingStatus.expiresAtISO).toLocaleDateString()
    : null;
  
  const [isManaging, setIsManaging] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [activePreference, setActivePreference] = useState<PreferenceSection>(null);
  const [supportName, setSupportName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [isSendingSupport, setIsSendingSupport] = useState(false);
  const [preferenceStatus, setPreferenceStatus] = useState<string | null>(null);
  const [expandedFaqQuestion, setExpandedFaqQuestion] = useState<string | null>(null);
  const [pageWidth, setPageWidth] = useState(windowWidth);
  const slideX = useRef(new Animated.Value(0)).current;

  const responsiveTopPadding =
    windowHeight >= 900
      ? spacing.xxxl
      : windowHeight >= 820
        ? spacing.xxl
        : windowHeight >= 760
          ? spacing.xl
          : spacing.lg;

  const pageContentSpacing = {
    paddingTop: responsiveTopPadding,
    paddingBottom: windowHeight >= 820 ? spacing.xxl : spacing.xl,
  };

  const handleManagePress = async () => {
    setIsManaging(true);
    try {
      await RevenueCatUI.presentCustomerCenter();
      await onRefreshBilling();
    } catch (err: any) {
      const message = err?.message || 'Failed to open Customer Center';
      console.error(`[Customer Center] ${message}`);
    } finally {
      setIsManaging(false);
    }
  };

  const handleRestorePurchases = async () => {
    setIsRestoring(true);
    setPreferenceStatus(null);
    try {
      const result = await restorePurchases();
      if (result.isPro) {
        setPreferenceStatus('Your Pro subscription has been successfully restored!');
        await updateTier('Pro');
      } else {
        setPreferenceStatus('No active subscription found linked to your Apple ID.');
      }
    } catch (error: any) {
      setPreferenceStatus(error?.message || 'Failed to restore purchases. Please try again.');
    } finally {
      setIsRestoring(false);
    }
  };

  const openPreferenceScreen = (section: Exclude<PreferenceSection, null>) => {
    setPreferenceStatus(null);
    setActivePreference(section);
    Animated.timing(slideX, {
      toValue: -pageWidth,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const handleBackFromPreference = () => {
    Animated.timing(slideX, {
      toValue: 0,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setActivePreference(null);
      setPreferenceStatus(null);
    });
  };

  const handleLocationPermissionAction = async () => {
    const status = await getLocationPermissionStatus();

    if (status === 'granted') {
      setPreferenceStatus('Location permission is already enabled.');
      return;
    }

    const granted = await requestLocationPermission();
    if (granted) {
      setPreferenceStatus('Location permission is now enabled.');
      return;
    }

    setPreferenceStatus('Location permission is still off. You can enable it in app settings.');
  };

  const handleSubmitSupport = async () => {
    if (!supportName.trim() || !supportEmail.trim() || !supportMessage.trim()) {
      setPreferenceStatus('Please fill out your name, email, and message.');
      return;
    }

    setIsSendingSupport(true);
    try {
      const subject = encodeURIComponent('Parker Support Request');
      const body = encodeURIComponent(
        `Name: ${supportName.trim()}\nEmail: ${supportEmail.trim()}\n\n${supportMessage.trim()}`
      );
      const mailtoUrl = `mailto:support@parker.app?subject=${subject}&body=${body}`;

      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (!canOpen) {
        throw new Error('No email app is configured on this device.');
      }

      await Linking.openURL(mailtoUrl);
      setPreferenceStatus('Support draft opened in your email app.');
    } catch (error: any) {
      setPreferenceStatus(error?.message || 'Unable to open your email app right now.');
    } finally {
      setIsSendingSupport(false);
    }
  };

  const renderPreferenceDetails = () => {
    if (activePreference === 'restore') {
      return (
        <>
          <View style={styles.detailCard}>
            <Text style={styles.detailParagraph}>
              Restore Purchases lets you recover any active subscriptions linked to your Apple ID — for example, if you reinstalled Parker or switched devices.
            </Text>
            <Text style={styles.detailParagraph}>
              Tapping the button below will check your Apple ID for any previous Parker Pro purchases and reactivate them automatically.
            </Text>
            <Text style={styles.detailParagraph}>
              Confirming won't do anything if you don't have an active subscription.
            </Text>
            <TouchableOpacity
              style={[styles.preferencePrimaryButton, isRestoring && styles.submitButtonDisabled]}
              onPress={handleRestorePurchases}
              disabled={isRestoring}
              activeOpacity={0.7}
            >
              {isRestoring ? (
                <ActivityIndicator color={colors.neutral[0]} />
              ) : (
                <Text style={styles.preferencePrimaryButtonText}>Confirm Restore Purchase</Text>
              )}
            </TouchableOpacity>
          </View>
          {preferenceStatus ? <Text style={styles.inlineStatus}>{preferenceStatus}</Text> : null}
        </>
      );
    }

    if (activePreference === 'notifications') {
      return (
        <View style={styles.detailCard}>
          <Text style={styles.detailParagraph}>Smart Notifications (Upcoming)</Text>
          <Text style={styles.detailParagraph}>
            Coming soon: if you park in a paid zone, Parker will track your paid parking window and notify you before charges start or when it’s time to move.
          </Text>
        </View>
      );
    }

    if (activePreference === 'privacy') {
      return (
        <>
          <View style={styles.detailCard}>
            <Text style={styles.detailParagraph}>Control how Parker uses your location.</Text>
            <Text style={styles.detailParagraph}>
              You can review your current permission state, request access again, or open app settings to update permissions manually.
            </Text>
            <TouchableOpacity style={styles.preferencePrimaryButton} onPress={handleLocationPermissionAction}>
              <Text style={styles.preferencePrimaryButtonText}>Check / Request Location Access</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.preferencePrimaryButton}
              onPress={async () => {
                const opened = await openAppPermissionSettings();
                if (!opened) {
                  setPreferenceStatus('Could not open settings on this device.');
                }
              }}
            >
              <Text style={styles.preferencePrimaryButtonText}>Open App Settings</Text>
            </TouchableOpacity>
          </View>
          {preferenceStatus ? <Text style={styles.inlineStatus}>{preferenceStatus}</Text> : null}
        </>
      );
    }

    const faqItems = [
      {
        q: 'How do I save my parking spot?',
        a: 'Tap “Save Parking Spot” on Home while location services are enabled.',
      },
      {
        q: 'Why does navigation show different times?',
        a: 'Times are estimates based on your current location and walking route updates.',
      },
      {
        q: 'How do I manage my subscription?',
        a: 'Use “Manage or Cancel Subscription” in Settings to open subscription controls.',
      },
      {
        q: 'Why can’t I load a route right now?',
        a: 'Check internet and location access, then retry navigation from Home.',
      },
      {
        q: 'How can I avoid forgetting where I parked?',
        a: 'Save your spot right after parking and double-check that location permissions are enabled.',
      },
      {
        q: 'How quickly will I get a reply?',
        a: 'Most support requests are reviewed as soon as possible after submission.',
      },
      {
        q: 'Can I request a new feature?',
        a: 'Yes—use the form below and include your use case and ideal workflow.',
      },
    ];

    return (
      <>
        <View style={styles.detailCard}>
          <Text style={styles.faqTitle} numberOfLines={1} adjustsFontSizeToFit>
            Frequently Asked Questions
          </Text>
          {faqItems.map((item) => {
            const isExpanded = expandedFaqQuestion === item.q;
            return (
              <TouchableOpacity
                key={item.q}
                style={[styles.faqItem, isExpanded && styles.faqItemExpanded]}
                activeOpacity={0.85}
                onPress={() => setExpandedFaqQuestion(isExpanded ? null : item.q)}
              >
                <View style={styles.faqHeaderRow}>
                  <Text style={styles.faqQuestion}>{item.q}</Text>
                  {isExpanded ? (
                    <ChevronDownIcon size={18} color={colors.brand[700]} />
                  ) : (
                    <ChevronRightIcon size={18} color={colors.brand[700]} />
                  )}
                </View>
                {isExpanded ? <Text style={styles.faqAnswer}>{item.a}</Text> : null}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.detailCard}>
          <Text style={styles.askTitle} numberOfLines={1} adjustsFontSizeToFit>
            Ask Me Anything
          </Text>
          <Text style={styles.inputLabel}>Your name</Text>
          <TextInput
            style={styles.input}
            value={supportName}
            onChangeText={setSupportName}
            placeholder="Jane Doe"
            autoCapitalize="words"
          />

          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            value={supportEmail}
            onChangeText={setSupportEmail}
            placeholder="you@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.inputLabel}>How can we help?</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={supportMessage}
            onChangeText={setSupportMessage}
            multiline
            placeholder="Describe your question or issue"
          />

          <TouchableOpacity
            style={[styles.submitButton, isSendingSupport && styles.submitButtonDisabled]}
            onPress={handleSubmitSupport}
            disabled={isSendingSupport}
          >
            {isSendingSupport ? (
              <ActivityIndicator color={colors.neutral[0]} />
            ) : (
              <Text style={styles.submitButtonText}>Send to Support</Text>
            )}
          </TouchableOpacity>
          {preferenceStatus ? <Text style={styles.inlineStatus}>{preferenceStatus}</Text> : null}
        </View>
      </>
    );
  };

  const preferenceTitle =
    activePreference === 'notifications'
      ? 'Notifications'
      : activePreference === 'privacy'
        ? 'Privacy & Location'
        : activePreference === 'restore'
          ? 'Restore Purchase'
          : 'Help & Support';

  return (
    <View
      style={styles.container}
      onLayout={(event) => {
        const measuredWidth = event.nativeEvent.layout.width;
        if (measuredWidth > 0 && Math.abs(measuredWidth - pageWidth) > 1) {
          setPageWidth(measuredWidth);
          if (activePreference === null) {
            slideX.setValue(0);
          } else {
            slideX.setValue(-measuredWidth);
          }
        }
      }}
    >
      <Animated.View style={[styles.pager, { width: pageWidth * 2, transform: [{ translateX: slideX }] }]}> 
        <ScrollView style={[styles.page, { width: pageWidth }]} contentContainerStyle={[styles.scrollContent, pageContentSpacing]}>
          <View style={styles.titleRow}>
            <Text style={styles.header}>Settings</Text>
          </View>

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
                    <SparklesIcon size={16} color={colors.brand[500]} />
                  ) : (
                    <MinusCircleIcon size={16} color={colors.brand[500]} />
                  )}
                </View>
                <View style={styles.tierInfo}>
                  <Text style={styles.tierName}>{t}</Text>
                  <Text style={styles.tierDesc}>
                    {t === 'Free' ? '10 uses/mo' : 'Unlimited uses'}
                  </Text>
                </View>
              </View>
              {tier === t && (
                <View style={styles.tierSelectedIndicator}>
                  <CheckCircleSolidIcon size={20} color={colors.brand[500]} />
                </View>
              )}
            </TouchableOpacity>
          ))}
          
          {tier === 'Pro' && billingStatus.enabled && (
            <TouchableOpacity
              style={[styles.restoreButton]}
              onPress={handleManagePress}
              disabled={isManaging}
              activeOpacity={0.7}
            >
              <SettingsIcon size={16} color={colors.brand[600]} />
              <Text style={[styles.restoreButtonText, isManaging && styles.restoreButtonTextDisabled]}>
                {isManaging ? 'Opening...' : 'Manage or Cancel Subscription'}
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.restoreButton]}
            onPress={() => openPreferenceScreen('restore')}
            activeOpacity={0.7}
          >
            <ArrowPathIcon size={16} color={colors.brand[600]} />
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          </TouchableOpacity>
        </View>
          </View>

          {/* Preferences Section */}
          <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.settingButton} onPress={() => openPreferenceScreen('notifications')} activeOpacity={0.7}>
            <View style={styles.settingContent}>
              <BellIcon size={18} color={colors.brand[600]} />
              <Text style={styles.settingLabel}>Notifications</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingButton} onPress={() => openPreferenceScreen('privacy')} activeOpacity={0.7}>
            <View style={styles.settingContent}>
              <ShieldCheckIcon size={18} color={colors.brand[600]} />
              <Text style={styles.settingLabel}>Privacy & Location</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.settingButton, styles.settingButtonLast]}
            onPress={() => openPreferenceScreen('help')}
            activeOpacity={0.7}
          >
            <View style={styles.settingContent}>
              <QuestionMarkCircleIcon size={18} color={colors.brand[600]} />
              <Text style={styles.settingLabel}>Help & Support</Text>
            </View>
          </TouchableOpacity>
        </View>
          </View>

          <Text style={styles.version}>Parker App v1.0.0</Text>
        </ScrollView>

        <ScrollView style={[styles.detailPage, { width: pageWidth }]} contentContainerStyle={[styles.scrollContent, pageContentSpacing]}>
          <View style={styles.detailHeader}>
            <TouchableOpacity style={styles.backButton} onPress={handleBackFromPreference}>
              <ArrowLeftIcon size={20} strokeWidth={2.2} color={colors.brand[600]} />
            </TouchableOpacity>
            <Text style={styles.detailTitle}>{preferenceTitle}</Text>
          </View>
          {renderPreferenceDetails()}
        </ScrollView>
      </Animated.View>
      
    </View>
  );
}
