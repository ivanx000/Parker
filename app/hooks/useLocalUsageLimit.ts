import { useCallback, useEffect, useMemo, useState } from 'react';
import { SubscriptionTier, UsageData } from '../types/parking';
import { storage } from '../lib/storage';
import { checkAndResetUsage, USAGE_COUNT_KEY, USAGE_MONTH_KEY } from '../lib/usage';

const TIER_KEY = 'sub_tier';
const FREE_NAVIGATION_LIMIT = 10;

export function useLocalUsageLimit(isPro: boolean) {
  const [tier, setTier] = useState<SubscriptionTier>('Free');
  const [usage, setUsage] = useState<UsageData>({ month: '', count: 0 });

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      const [savedTier, savedMonth, savedCount] = await Promise.all([
        storage.getItem<SubscriptionTier>(TIER_KEY),
        storage.getItem<string>(USAGE_MONTH_KEY),
        storage.getItem<number>(USAGE_COUNT_KEY),
      ]);

      if (!isActive) return;

      if (savedTier) {
        setTier(savedTier);
      }

      const savedUsage: UsageData | null = savedMonth
        ? {
            month: savedMonth,
            count: typeof savedCount === 'number' ? savedCount : 0,
          }
        : null;

      const validUsage = checkAndResetUsage(savedUsage);
      setUsage(validUsage);

      if (!savedUsage || savedUsage.month !== validUsage.month) {
        await Promise.all([
          storage.setItem(USAGE_MONTH_KEY, validUsage.month),
          storage.setItem(USAGE_COUNT_KEY, validUsage.count),
        ]);
      }
    };

    load();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (isPro && tier !== 'Pro') {
      setTier('Pro');
      storage.setItem(TIER_KEY, 'Pro');
    }
  }, [isPro, tier]);

  const effectiveTier: SubscriptionTier = useMemo(() => {
    if (isPro) return 'Pro';
    return tier === 'Pro' ? 'Free' : tier;
  }, [isPro, tier]);

  const limit = effectiveTier === 'Pro' ? Infinity : FREE_NAVIGATION_LIMIT;

  const decrementSession = useCallback(() => {
    if (effectiveTier === 'Pro') {
      return true;
    }

    if (usage.count >= FREE_NAVIGATION_LIMIT) {
      return false;
    }

    const newCount = usage.count + 1;
    const newUsage = { ...usage, count: newCount };
    setUsage(newUsage);
    storage.setItem(USAGE_COUNT_KEY, newCount);
    return true;
  }, [effectiveTier, usage]);

  const updateTier = useCallback((newTier: SubscriptionTier) => {
    setTier(newTier);
    storage.setItem(TIER_KEY, newTier);
  }, []);

  return { tier: effectiveTier, usage, limit, decrementSession, updateTier };
}
