import * as Location from 'expo-location';
import { Linking } from 'react-native';

export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const p1 = lat1 * Math.PI/180;
  const p2 = lat2 * Math.PI/180;
  const dp = (lat2-lat1) * Math.PI/180;
  const dl = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(dp/2) * Math.sin(dp/2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl/2) * Math.sin(dl/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

export function formatDistance(meters: number) {
  if (meters < 10) return 'Just here';
  if (meters < 1000) return `${Math.round(meters)}m away`;
  return `${(meters / 1000).toFixed(1)}km away`;
}

export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (err) {
    console.error('Error requesting location permission:', err);
    return false;
  }
}

export async function getLocationPermissionStatus(): Promise<Location.PermissionStatus | null> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status;
  } catch (err) {
    console.error('Error checking location permission:', err);
    return null;
  }
}

export async function openAppPermissionSettings(): Promise<boolean> {
  try {
    await Linking.openSettings();
    return true;
  } catch (err) {
    console.error('Error opening app settings:', err);
    return false;
  }
}

export async function getCurrentLocation(): Promise<Location.LocationObject> {
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return location;
}
