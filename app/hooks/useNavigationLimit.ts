import { useState, useEffect, useCallback } from 'react';
import { SubscriptionTier, UsageData } from '../types/parking';
import { storage } from '../lib/storage';
import { checkAndResetUsage, USAGE_MONTH_KEY, USAGE_COUNT_KEY } from '../lib/usage';

const TIER_KEY = 'sub_tier';

const TIER_LIMITS: Record<SubscriptionTier, number> = {
  Free: 10,
  Starter: 60,
  Pro: Infinity,
};

export function useNavigationLimit() {
  const [tier, setTier] = useState<SubscriptionTier>('Free');
  const [usage, setUsage] = useState<UsageData>({ month: '', count: 0 });

  useEffect(() => {
    storage.getItem(TIER_KEY).then(savedTier => {
      if (savedTier) setTier(savedTier);
    });

    Promise.all([
      storage.getItem(USAGE_MONTH_KEY),
      storage.getItem(USAGE_COUNT_KEY)
    ]).then(([savedMonth, savedCount]) => {
      const savedUsage: UsageData | null = savedMonth ? { 
        month: savedMonth, 
        count: typeof savedCount === 'number' ? savedCount : 0 
      } : null;
      
      const validUsage = checkAndResetUsage(savedUsage);
      setUsage(validUsage);
      
      if (!savedUsage || savedUsage.month !== validUsage.month) {
        storage.setItem(USAGE_MONTH_KEY, validUsage.month);
        storage.setItem(USAGE_COUNT_KEY, validUsage.count);
      }
    });
  }, []);

  const decrementSession = useCallback(() => {
    const limit = TIER_LIMITS[tier];
    if (usage.count >= limit) {
      return false; // Out of sessions
    }
    const newCount = usage.count + 1;
    const newUsage = { ...usage, count: newCount };
    setUsage(newUsage);
    storage.setItem(USAGE_COUNT_KEY, newCount);
    return true; // Session used
  }, [tier, usage]);

  const updateTier = useCallback((newTier: SubscriptionTier) => {
    setTier(newTier);
    storage.setItem(TIER_KEY, newTier);
  }, []);

  return { tier, usage, limit: TIER_LIMITS[tier], decrementSession, updateTier };
}
