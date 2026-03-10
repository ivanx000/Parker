import { UsageData } from '../types/parking';

export const USAGE_MONTH_KEY = 'navMonthKey';
export const USAGE_COUNT_KEY = 'navUsedCount';

export function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7); // "YYYY-MM"
}

export function checkAndResetUsage(data: UsageData | null): UsageData {
  const currentMonth = getCurrentMonth();
  if (!data || data.month !== currentMonth) {
    return { month: currentMonth, count: 0 };
  }
  return data;
}
