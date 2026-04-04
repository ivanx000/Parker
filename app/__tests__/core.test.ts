/**
 * Core Regression Test Suite
 *
 * Purpose:
 * This file contains deterministic unit tests for core business logic so future
 * refactors can be validated quickly without opening the simulator.
 *
 * What this suite covers:
 * 1) Location utilities: distance math and display formatting thresholds.
 * 2) Usage reset logic: monthly rollover behavior for navigation usage limits.
 * 3) Storage wrapper behavior: JSON serialization/deserialization and error fallback.
 * 4) RevenueCat entitlement logic: Pro-access determination fallback behavior.
 *
 * How to run:
 * 1) From the app folder:
 *      cd /Users/ivanxie/Developer/parker/app
 * 2) Run all tests once:
 *      npm run test
 * 3) Run in watch mode while developing:
 *      npm run test:watch
 * 4) Run CI-style (single process, stable output):
 *      npm run test:ci
 *
 * Notes:
 * - These tests intentionally avoid simulator-native rendering dependencies.
 * - If a refactor changes business rules, these tests should fail and catch it.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  Linking: {
    openSettings: jest.fn(),
  },
}));

jest.mock('expo-location', () => ({
  Accuracy: {
    Balanced: 'balanced',
  },
  requestForegroundPermissionsAsync: jest.fn(),
  getForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {},
  LOG_LEVEL: { DEBUG: 'DEBUG' },
  PURCHASES_ERROR_CODE: {
    PURCHASE_CANCELLED_ERROR: 'PURCHASE_CANCELLED_ERROR',
  },
}));

import { Linking } from 'react-native';
import {
  formatDistance,
  getCurrentLocation,
  getDistance,
  getLocationPermissionStatus,
  openAppPermissionSettings,
  requestLocationPermission,
} from '../lib/location';
import { storage } from '../lib/storage';
import { checkAndResetUsage, getCurrentMonth } from '../lib/usage';
import { hasProEntitlement } from '../lib/revenuecat';

let consoleErrorSpy: jest.SpyInstance;

beforeAll(() => {
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterAll(() => {
  consoleErrorSpy.mockRestore();
});

describe('location helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns near-zero for identical coordinates', () => {
    expect(getDistance(37.7749, -122.4194, 37.7749, -122.4194)).toBeCloseTo(0, 6);
  });

  it('returns around 111km for one degree latitude', () => {
    const distance = getDistance(0, 0, 1, 0);
    expect(distance).toBeGreaterThan(111000);
    expect(distance).toBeLessThan(112500);
  });

  it('formats tiny distances as Just here', () => {
    expect(formatDistance(9)).toBe('Just here');
  });

  it('formats meter range as Xm away', () => {
    expect(formatDistance(243)).toBe('243m away');
  });

  it('formats kilometer range with one decimal', () => {
    expect(formatDistance(1543)).toBe('1.5km away');
  });

  it('maps granted permission status to true', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    await expect(requestLocationPermission()).resolves.toBe(true);
  });

  it('returns false when permission request throws', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockRejectedValue(new Error('boom'));
    await expect(requestLocationPermission()).resolves.toBe(false);
  });

  it('returns current foreground permission status', async () => {
    (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
    await expect(getLocationPermissionStatus()).resolves.toBe('denied');
  });

  it('opens app settings successfully', async () => {
    (Linking.openSettings as jest.Mock).mockResolvedValue(undefined);
    await expect(openAppPermissionSettings()).resolves.toBe(true);
    expect(Linking.openSettings).toHaveBeenCalledTimes(1);
  });

  it('returns false when opening app settings fails', async () => {
    (Linking.openSettings as jest.Mock).mockRejectedValue(new Error('nope'));
    await expect(openAppPermissionSettings()).resolves.toBe(false);
  });

  it('requests current location with balanced accuracy', async () => {
    const mockLocation = {
      coords: {
        latitude: 10,
        longitude: 20,
        accuracy: 5,
      },
    } as any;

    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue(mockLocation);

    await expect(getCurrentLocation()).resolves.toEqual(mockLocation);
    expect(Location.getCurrentPositionAsync).toHaveBeenCalledWith({
      accuracy: Location.Accuracy.Balanced,
    });
  });
});

describe('storage wrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('serializes objects when setting items', async () => {
    await storage.setItem('parking_spot', { lat: 1, lng: 2 });
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('parking_spot', JSON.stringify({ lat: 1, lng: 2 }));
  });

  it('deserializes valid JSON from storage', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('{"lat":1,"lng":2}');
    await expect(storage.getItem('parking_spot')).resolves.toEqual({ lat: 1, lng: 2 });
  });

  it('returns null when no value exists', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    await expect(storage.getItem('missing')).resolves.toBeNull();
  });

  it('returns null when stored JSON is invalid', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('{invalid json');
    await expect(storage.getItem('parking_spot')).resolves.toBeNull();
  });

  it('removes an item by key', async () => {
    await storage.removeItem('parking_spot');
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('parking_spot');
  });
});

describe('usage logic', () => {
  it('returns current month in YYYY-MM format', () => {
    expect(getCurrentMonth()).toMatch(/^\d{4}-\d{2}$/);
  });

  it('resets count when stored month is stale', () => {
    const result = checkAndResetUsage({ month: '1999-01', count: 12 });
    expect(result.month).toBe(getCurrentMonth());
    expect(result.count).toBe(0);
  });

  it('preserves count when month is current', () => {
    const currentMonth = getCurrentMonth();
    const result = checkAndResetUsage({ month: currentMonth, count: 4 });
    expect(result).toEqual({ month: currentMonth, count: 4 });
  });
});

describe('revenuecat entitlement logic', () => {
  it('returns false with no entitlement and no active subscription', () => {
    const customerInfo = {
      entitlements: { active: {} },
      activeSubscriptions: [],
    } as any;

    expect(hasProEntitlement(customerInfo)).toBe(false);
  });

  it('returns true when Parker Pro entitlement exists', () => {
    const customerInfo = {
      entitlements: {
        active: {
          'Parker Pro': {
            productIdentifier: 'monthly',
          },
        },
      },
      activeSubscriptions: [],
    } as any;

    expect(hasProEntitlement(customerInfo)).toBe(true);
  });

  it('returns true when any active subscription exists (fallback path)', () => {
    const customerInfo = {
      entitlements: { active: {} },
      activeSubscriptions: ['monthly'],
    } as any;

    expect(hasProEntitlement(customerInfo)).toBe(true);
  });
});
