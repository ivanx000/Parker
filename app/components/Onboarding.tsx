import React, { useState } from 'react';
import { View } from 'react-native';
import IntroScreen from '../app/(onboarding)/intro';
import WelcomeScreen from '../app/(onboarding)/welcome';
import FeaturesScreen from '../app/(onboarding)/features';
import PaywallScreen from '../app/(onboarding)/paywall';
import { SubscriptionTier } from '../types/parking';

export function Onboarding({
  onComplete,
  onSelectTier,
}: {
  onComplete: () => void;
  onSelectTier: (tier: SubscriptionTier) => Promise<boolean>;
}) {
  const [step, setStep] = useState(0);

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAFA', zIndex: 50 }}>
      {step === 0 && <IntroScreen key="intro" onNext={() => setStep(1)} />}
      {step === 1 && <WelcomeScreen key="welcome" onNext={() => setStep(2)} />}
      {step === 2 && <FeaturesScreen key="features" onNext={() => setStep(3)} />}
      {step === 3 && <PaywallScreen key="paywall" onComplete={onComplete} onSelectTier={onSelectTier} />}
    </View>
  );
}
