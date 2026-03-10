import { Linking, Platform } from 'react-native';

export function getNavigationLink(lat: number, lng: number) {
  if (Platform.OS === 'ios') {
    return `http://maps.apple.com/?daddr=${lat},${lng}&dirflg=w`;
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
}

export async function openNavigation(lat: number, lng: number) {
  const url = getNavigationLink(lat, lng);
  await Linking.openURL(url);
}
