export interface ParkingSpot {
  lat: number;
  lng: number;
  accuracyMeters: number;
  savedAtISO: string;
}

export type SubscriptionTier = 'Free' | 'Starter' | 'Pro';

export interface UsageData {
  month: string;
  count: number;
}
