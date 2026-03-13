import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckIcon, ClockIcon, MapPinIcon, ExclamationTriangleIcon } from 'react-native-heroicons/outline';
import { ParkingSpot } from '../types/parking';
import { formatDistance } from '../lib/location';
import { colors, spacing, typography, radius } from '../lib/design-system';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  content: {
    gap: spacing.sm + 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  rowIcon: {
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleText: {
    ...typography.h3,
    color: colors.neutral[950],
  },
  rowText: {
    ...typography.caption,
    fontWeight: '500',
    color: colors.neutral[500],
  },
  warningBox: {
    marginTop: spacing.lg,
    backgroundColor: colors.warning.light,
    borderWidth: 1,
    borderColor: colors.warning.default,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  warningText: {
    ...typography.small,
    color: colors.warning.text,
    flex: 1,
  },
});

function formatTimeAgo(isoString: string) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  return `${Math.floor(diffHours / 24)} days ago`;
}

export function StatusCard({ spot, distance }: { spot: ParkingSpot, distance: number | null }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <CheckIcon size={20} color={colors.brand[500]} strokeWidth={3} />
            </View>
            <Text style={styles.titleText}>Saved successfully</Text>
          </View>
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <ClockIcon size={18} color={colors.brand[500]} />
            </View>
            <Text style={styles.rowText}>{`Saved ${formatTimeAgo(spot.savedAtISO)}`}</Text>
          </View>
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <MapPinIcon size={18} color={colors.brand[500]} />
            </View>
            <Text style={styles.rowText}>{distance !== null ? formatDistance(distance) : 'Calculating...'}</Text>
          </View>
        </View>

        {spot.accuracyMeters > 50 && (
          <View style={styles.warningBox}>
            <ExclamationTriangleIcon size={18} color={colors.brand[500]} />
            <Text style={styles.warningText}>
              GPS accuracy was low (±{Math.round(spot.accuracyMeters)}m). Your saved location might be slightly off.
            </Text>
          </View>
        )}
      </View>
  );
}
