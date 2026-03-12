import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Animated, Dimensions, PanResponder } from 'react-native';
import MapView, { LatLng, Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Constants from 'expo-constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, elevation } from '../lib/design-system';
import { storage } from '../lib/storage';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;
const TOP_LEFT_BUTTON_TOP = Math.max((Constants.statusBarHeight ?? 0) - 30, 2);

type Position = { lat: number; lng: number };
type DirectionStep = {
  instruction: string;
  distanceText: string;
  durationText: string;
};

type CachedRoutePayload = {
  destination: Position;
  points: LatLng[];
  distanceText: string;
  durationText: string;
  steps: DirectionStep[];
  updatedAt: number;
};

const WALKING_SPEED_MPS = 1.4;
const ROUTE_CACHE_KEY = 'last_navigation_route';
const ROUTE_CACHE_TTL_MS = 1000 * 60 * 10;

function parseDurationSeconds(duration: string | undefined) {
  if (!duration) return 0;
  const value = parseInt(duration.replace('s', ''), 10);
  return Number.isFinite(value) ? value : 0;
}

function formatDistance(distanceMeters: number) {
  if (distanceMeters >= 1000) {
    return `${(distanceMeters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(distanceMeters)} m`;
}

function formatDuration(durationSeconds: number) {
  if (durationSeconds >= 3600) {
    return `${Math.round(durationSeconds / 3600)} h`;
  }
  if (durationSeconds >= 60) {
    return `${Math.round(durationSeconds / 60)} min`;
  }
  return `${durationSeconds} s`;
}

function straightLineDistanceMeters(from: Position, to: Position) {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusMeters = 6371000;
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMeters * c;
}

function getDirectionIcon(instruction: string): string {
  const lower = instruction.toLowerCase();
  
  if (lower.includes('continue') || lower.includes('head') || lower.includes('proceed')) {
    return 'arrow-up';
  }
  if (lower.includes('slight left')) {
    return 'arrow-top-left';
  }
  if (lower.includes('slight right')) {
    return 'arrow-top-right';
  }
  if (lower.includes('sharp left')) {
    return 'arrow-left';
  }
  if (lower.includes('sharp right')) {
    return 'arrow-right';
  }
  if (lower.includes('turn left') || lower.includes('left onto')) {
    return 'arrow-left-bottom';
  }
  if (lower.includes('turn right') || lower.includes('right onto')) {
    return 'arrow-right-bottom';
  }
  if (lower.includes('u-turn')) {
    return 'arrow-u-left-top';
  }
  if (lower.includes('cross') || lower.includes('roundabout')) {
    return 'walk';
  }
  
  return 'arrow-right';
}

function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += deltaLng;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return points;
}

function getGoogleMapsApiKey() {
  return (
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    Constants.expoConfig?.extra?.googleMapsApiKey ||
    Constants.expoConfig?.ios?.config?.googleMapsApiKey ||
    (Constants.expoConfig?.android?.config as any)?.googleMaps?.apiKey ||
    ''
  );
}

function normalizeInstruction(instruction: string) {
  return instruction
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function distanceBetweenPositions(from: Position, to: Position) {
  return straightLineDistanceMeters(from, to);
}

function trimRouteFromCurrentPosition(points: LatLng[], current: Position): LatLng[] {
  if (points.length < 2) return points;

  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  points.forEach((point, index) => {
    const currentDistance = distanceBetweenPositions(current, {
      lat: point.latitude,
      lng: point.longitude,
    });

    if (currentDistance < nearestDistance) {
      nearestDistance = currentDistance;
      nearestIndex = index;
    }
  });

  return [
    { latitude: current.lat, longitude: current.lng },
    ...points.slice(nearestIndex),
  ];
}

function deriveHeadingFromRoute(current: Position, points: LatLng[]) {
  if (points.length < 2) return 0;

  const workingPoints = trimRouteFromCurrentPosition(points, current);
  const nextPoint = workingPoints[1] || workingPoints[0];
  if (!nextPoint) return 0;

  const lat1 = (current.lat * Math.PI) / 180;
  const lat2 = (nextPoint.latitude * Math.PI) / 180;
  const diffLong = ((nextPoint.longitude - current.lng) * Math.PI) / 180;

  const y = Math.sin(diffLong) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(diffLong);

  const heading = (Math.atan2(y, x) * 180) / Math.PI;
  return (heading + 360) % 360;
}

async function getRoute(current: Position, destination: Position) {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    throw new Error('Missing Google Maps API key for directions');
  }

  const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': '*',
    },
    body: JSON.stringify({
      origin: {
        location: {
          latLng: {
            latitude: current.lat,
            longitude: current.lng,
          },
        },
      },
      destination: {
        location: {
          latLng: {
            latitude: destination.lat,
            longitude: destination.lng,
          },
        },
      },
      travelMode: 'WALK',
      computeAlternativeRoutes: false,
    }),
  });

  const data = await response.json();

  if (!data.routes?.length) {
    throw new Error(data.error?.message || 'Unable to load route');
  }

  const route = data.routes[0];
  const leg = route.legs?.[0];
  const steps: DirectionStep[] = [];
  
  if (leg?.steps) {
    leg.steps.forEach((step: any) => {
      const distanceMeters = step.distanceMeters || 0;
      const durationSeconds = parseDurationSeconds(step.duration || step.staticDuration);
      
      steps.push({
        instruction: normalizeInstruction(step.navigationInstruction?.instructions || ''),
        distanceText: formatDistance(distanceMeters),
        durationText: formatDuration(durationSeconds),
      });
    });
  }

  // Format total distance and duration
  const totalDistanceMeters = leg?.distanceMeters || route.distanceMeters || 0;
  const totalDurationSeconds = parseDurationSeconds(route.duration || leg?.duration || leg?.staticDuration);

  return {
    points: decodePolyline(route.polyline?.encodedPolyline || ''),
    distanceText: formatDistance(totalDistanceMeters),
    durationText: formatDuration(totalDurationSeconds),
    steps,
  };
}

const MIN_SHEET_HEIGHT = 90; // Minimized with basic info
const MID_SHEET_HEIGHT = 220;
const MAX_SHEET_HEIGHT = SCREEN_HEIGHT * 0.75;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: SCREEN_WIDTH,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    ...elevation.lg,
    shadowOffset: { width: 0, height: -4 },
  },
  topLeftCancelButton: {
    position: 'absolute',
    top: TOP_LEFT_BUTTON_TOP,
    left: spacing.md,
    zIndex: 20,
    backgroundColor: colors.error.default,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...elevation.md,
  },
  topLeftCancelButtonText: {
    ...typography.smallBold,
    color: colors.neutral[0],
    letterSpacing: 0.2,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: colors.neutral[300],
    borderRadius: radius.round,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  sheetContent: {
    paddingBottom: spacing.xl,
  },
  metricsContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    gap: spacing.lg,
  },
  metricBlock: {
    flex: 1,
    alignItems: 'flex-start',
  },
  metricBlockRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  metricLabel: {
    ...typography.smallBold,
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  metricValue: {
    ...typography.h3,
    color: colors.neutral[950],
    fontWeight: '700',
    fontSize: 20,
  },
  timeValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  expandedContainer: {
    flex: 1,
  },
  sheetScrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  recenterButton: {
    position: 'absolute',
    top: -60,
    right: spacing.md,
    gap: spacing.sm,
    zIndex: 15,
  },
  mapControlButton: {
    width: 56,
    height: 56,
    borderRadius: radius.xl,
    backgroundColor: colors.brand[500],
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.md,
  },
  mapControlButtonSecondary: {
    backgroundColor: colors.neutral[900],
  },
  mapControlIconCenter: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepsSection: {
    marginTop: spacing.sm,
  },
  stepsTitle: {
    ...typography.bodyBold,
    color: colors.neutral[900],
    marginBottom: spacing.md,
    textAlign: 'left',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  stepIcon: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepContent: {
    flex: 1,
  },
  stepInstruction: {
    ...typography.body,
    color: colors.neutral[900],
    fontWeight: '500',
    marginBottom: 4,
  },
  stepDistance: {
    ...typography.small,
    color: colors.neutral[500],
    fontSize: 13,
  },
  centerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    zIndex: 5,
  },
  centerText: {
    marginTop: spacing.sm,
    ...typography.caption,
    color: colors.neutral[600],
  },
  errorText: {
    ...typography.body,
    color: colors.warning.default,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

export function NavigationScreen({
  currentPos,
  destination,
  onBack,
}: {
  currentPos: Position | null;
  destination: Position;
  onBack: () => void;
}) {
  const mapRef = useRef<MapView | null>(null);
  const [routePoints, setRoutePoints] = useState<LatLng[]>([]);
  const [distanceText, setDistanceText] = useState('');
  const [durationText, setDurationText] = useState('');
  const [steps, setSteps] = useState<DirectionStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [metricsSectionHeight, setMetricsSectionHeight] = useState(MIN_SHEET_HEIGHT);
  const [expandedContentHeight, setExpandedContentHeight] = useState(0);
  const currentSheetStateRef = useRef<'min' | 'mid' | 'max'>('min');
  const dynamicMidSheetHeightRef = useRef(MID_SHEET_HEIGHT);
  const dynamicMaxSheetHeightRef = useRef(MAX_SHEET_HEIGHT);
  const hasLoadedInitialRouteRef = useRef(false);
  const hasAutoFitRef = useRef(false);

  // Entry animation
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Bottom sheet animation
  const sheetHeight = useRef(new Animated.Value(MIN_SHEET_HEIGHT)).current;
  const [currentSheetState, setCurrentSheetState] = useState<'min' | 'mid' | 'max'>('min');

  const fallbackDistanceMeters = useMemo(() => {
    if (!currentPos) return null;
    return straightLineDistanceMeters(currentPos, destination);
  }, [currentPos, destination]);

  const fallbackDurationSeconds = useMemo(() => {
    if (fallbackDistanceMeters === null) return null;
    return Math.round(fallbackDistanceMeters / WALKING_SPEED_MPS);
  }, [fallbackDistanceMeters]);

  const minDistanceDisplay = distanceText || (fallbackDistanceMeters !== null ? formatDistance(fallbackDistanceMeters) : '--');
  const minDurationDisplay = durationText || (fallbackDurationSeconds !== null ? formatDuration(fallbackDurationSeconds) : 'Waiting for location');
  const hasExpandableContent = steps.length > 0 || !!routeError;

  const dynamicMaxSheetHeight = useMemo(() => {
    if (!hasExpandableContent) {
      return MIN_SHEET_HEIGHT;
    }
    const estimatedExpandedHeight = expandedContentHeight > 0 ? expandedContentHeight : MID_SHEET_HEIGHT;
    const measured = metricsSectionHeight + estimatedExpandedHeight + spacing.md;
    return Math.max(MID_SHEET_HEIGHT, Math.min(MAX_SHEET_HEIGHT, measured));
  }, [hasExpandableContent, metricsSectionHeight, expandedContentHeight]);

  const dynamicMidSheetHeight = useMemo(() => {
    if (dynamicMaxSheetHeight <= MIN_SHEET_HEIGHT + 24) return MIN_SHEET_HEIGHT;
    const midpoint = MIN_SHEET_HEIGHT + (dynamicMaxSheetHeight - MIN_SHEET_HEIGHT) * 0.55;
    return Math.min(MID_SHEET_HEIGHT, midpoint);
  }, [dynamicMaxSheetHeight]);

  const modeIconName = 'walk';

  const fitRouteOverview = (animated = true) => {
    if (!mapRef.current || routePoints.length < 2) return;

    const pointsToFit = [...routePoints];
    if (currentPos) {
      pointsToFit.push({ latitude: currentPos.lat, longitude: currentPos.lng });
    }

    pointsToFit.push({ latitude: destination.lat, longitude: destination.lng });

    mapRef.current.fitToCoordinates(pointsToFit, {
      edgePadding: {
        top: 96,
        right: 36,
        bottom: MIN_SHEET_HEIGHT + 96,
        left: 36,
      },
      animated,
    });
  };

  const handleCloseNavigationView = () => {
    if (!mapRef.current || !currentPos) return;

    const heading = deriveHeadingFromRoute(currentPos, routePoints);
    mapRef.current.animateCamera(
      {
        center: { latitude: currentPos.lat, longitude: currentPos.lng },
        heading,
        pitch: 55,
        zoom: 18,
      },
      { duration: 450 }
    );
  };

  useEffect(() => {
    currentSheetStateRef.current = currentSheetState;
  }, [currentSheetState]);

  useEffect(() => {
    dynamicMidSheetHeightRef.current = dynamicMidSheetHeight;
    dynamicMaxSheetHeightRef.current = dynamicMaxSheetHeight;
  }, [dynamicMidSheetHeight, dynamicMaxSheetHeight]);

  const initialRegion = useMemo(() => ({
    latitude: destination.lat,
    longitude: destination.lng,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  }), [destination.lat, destination.lng]);

  // Entry animation on mount
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadRoute = async () => {
      if (!currentPos || hasLoadedInitialRouteRef.current) return;

      hasLoadedInitialRouteRef.current = true;

      try {
        setLoading(true);
        setRouteError(null);

        const cached = await storage.getItem(ROUTE_CACHE_KEY) as CachedRoutePayload | null;
        const isCacheValid =
          !!cached &&
          Date.now() - cached.updatedAt < ROUTE_CACHE_TTL_MS &&
          Math.abs(cached.destination.lat - destination.lat) < 0.0001 &&
          Math.abs(cached.destination.lng - destination.lng) < 0.0001 &&
          cached.points.length > 1;

        if (isCacheValid && cached) {
          const adjustedPoints = trimRouteFromCurrentPosition(cached.points, currentPos);
          if (!isActive) return;
          setRoutePoints(adjustedPoints);
          setDistanceText(cached.distanceText);
          setDurationText(cached.durationText);
          setSteps(cached.steps);
          return;
        }

        const route = await getRoute(currentPos, destination);
        if (!isActive) return;

        setRoutePoints(route.points);
        setDistanceText(route.distanceText);
        setDurationText(route.durationText);
        setSteps(route.steps);

        const payload: CachedRoutePayload = {
          destination,
          points: route.points,
          distanceText: route.distanceText,
          durationText: route.durationText,
          steps: route.steps,
          updatedAt: Date.now(),
        };
        storage.setItem(ROUTE_CACHE_KEY, payload);
      } catch (err: any) {
        if (!isActive) return;
        setRoutePoints([]);
        setSteps([]);
        setRouteError(err?.message || 'Unable to load route');
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadRoute();

    return () => {
      isActive = false;
    };
  }, [currentPos, destination]);

  useEffect(() => {
    if (routePoints.length > 1) {
      hasAutoFitRef.current = false;
    }
  }, [routePoints]);

  useEffect(() => {
    if (routePoints.length > 1 && !hasAutoFitRef.current) {
      fitRouteOverview(true);
      hasAutoFitRef.current = true;
    }
  }, [routePoints]);

  // Pan responder for dragging the bottom sheet
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        const activeState = currentSheetStateRef.current;
        const dynamicMid = dynamicMidSheetHeightRef.current;
        const dynamicMax = dynamicMaxSheetHeightRef.current;
        const currentBaseHeight = (activeState === 'min' ? MIN_SHEET_HEIGHT : 
                                  activeState === 'mid' ? dynamicMid : 
                                  dynamicMax);
        const newHeight = currentBaseHeight - gestureState.dy;
        
        if (newHeight >= MIN_SHEET_HEIGHT && newHeight <= dynamicMax) {
          sheetHeight.setValue(newHeight);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const activeState = currentSheetStateRef.current;
        const dynamicMid = dynamicMidSheetHeightRef.current;
        const dynamicMax = dynamicMaxSheetHeightRef.current;
        const currentBaseHeight = (activeState === 'min' ? MIN_SHEET_HEIGHT : 
                                  activeState === 'mid' ? dynamicMid : 
                                  dynamicMax);
        const currentHeight = currentBaseHeight - gestureState.dy;

        if (dynamicMax <= MIN_SHEET_HEIGHT + 24) {
          setCurrentSheetState('min');
          Animated.spring(sheetHeight, {
            toValue: MIN_SHEET_HEIGHT,
            useNativeDriver: false,
            tension: 50,
            friction: 10,
          }).start();
          return;
        }
        
        let targetHeight = MIN_SHEET_HEIGHT;
        let targetState: 'min' | 'mid' | 'max' = 'min';
        
        // Determine target based on current position and velocity
        if (gestureState.dy < -50 || gestureState.vy < -0.5) {
          // Swiping up
          if (currentHeight < dynamicMid) {
            targetHeight = dynamicMid;
            targetState = 'mid';
          } else {
            targetHeight = dynamicMax;
            targetState = 'max';
          }
        } else if (gestureState.dy > 50 || gestureState.vy > 0.5) {
          // Swiping down
          if (currentHeight > dynamicMid) {
            targetHeight = dynamicMid;
            targetState = 'mid';
          } else {
            targetHeight = MIN_SHEET_HEIGHT;
            targetState = 'min';
          }
        } else {
          // Not enough velocity, snap to nearest
          const distToMin = Math.abs(currentHeight - MIN_SHEET_HEIGHT);
          const distToMid = Math.abs(currentHeight - dynamicMid);
          const distToMax = Math.abs(currentHeight - dynamicMax);
          
          if (distToMin <= distToMid && distToMin <= distToMax) {
            targetHeight = MIN_SHEET_HEIGHT;
            targetState = 'min';
          } else if (distToMid <= distToMax) {
            targetHeight = dynamicMid;
            targetState = 'mid';
          } else {
            targetHeight = dynamicMax;
            targetState = 'max';
          }
        }
        
        setCurrentSheetState(targetState);
        Animated.spring(sheetHeight, {
          toValue: targetHeight,
          useNativeDriver: false,
          tension: 50,
          friction: 10,
        }).start();
      },
    })
  ).current;

  useEffect(() => {
    const targetHeight =
      currentSheetState === 'min'
        ? MIN_SHEET_HEIGHT
        : currentSheetState === 'mid'
          ? dynamicMidSheetHeight
          : dynamicMaxSheetHeight;

    Animated.spring(sheetHeight, {
      toValue: targetHeight,
      useNativeDriver: false,
      tension: 50,
      friction: 10,
    }).start();
  }, [currentSheetState, dynamicMidSheetHeight, dynamicMaxSheetHeight, sheetHeight]);

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Full-screen map */}
      <MapView
        ref={(ref) => {
          mapRef.current = ref;
        }}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        zoomEnabled
        zoomControlEnabled={false}
      >
        {currentPos ? (
          <Marker
            coordinate={{ latitude: currentPos.lat, longitude: currentPos.lng }}
            title="You"
          />
        ) : null}

        <Marker
          coordinate={{ latitude: destination.lat, longitude: destination.lng }}
          title="Parked Car"
          pinColor={colors.success.default}
        />

        {routePoints.length > 1 ? (
          <Polyline
            coordinates={routePoints}
            strokeColor={colors.brand[500]}
            strokeWidth={5}
          />
        ) : null}
      </MapView>

      {/* Loading overlay */}
      {loading ? (
        <View style={styles.centerOverlay}>
          <ActivityIndicator size="large" color={colors.brand[500]} />
          <Text style={styles.centerText}>Loading route...</Text>
        </View>
      ) : null}

      <TouchableOpacity style={styles.topLeftCancelButton} onPress={onBack}>
        <Text style={styles.topLeftCancelButtonText}>←  Cancel Navigation</Text>
      </TouchableOpacity>

      {/* Draggable bottom sheet */}
      <Animated.View
        style={[
          styles.bottomSheet,
          {
            height: sheetHeight,
          },
        ]}
      >
        <View style={styles.recenterButton}>
          <TouchableOpacity style={styles.mapControlButton} onPress={() => fitRouteOverview(true)}>
            <View style={styles.mapControlIconCenter}>
              <MaterialCommunityIcons name="map-marker-path" size={24} color={colors.neutral[0]} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mapControlButton, styles.mapControlButtonSecondary]}
            onPress={handleCloseNavigationView}
          >
            <View style={styles.mapControlIconCenter}>
              <MaterialCommunityIcons name="navigation-variant" size={24} color={colors.neutral[0]} />
            </View>
          </TouchableOpacity>
        </View>

        <View onLayout={(event) => setMetricsSectionHeight(event.nativeEvent.layout.height)}>
          <View {...panResponder.panHandlers}>
            <View style={styles.sheetHandle} />
          </View>

          <View style={styles.metricsContainer}>
            <View style={styles.metricRow}>
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>Distance</Text>
                <Text style={styles.metricValue}>{minDistanceDisplay}</Text>
              </View>
              <View style={styles.metricBlockRight}>
                <Text style={styles.metricLabel}>Time</Text>
                <View style={styles.timeValueRow}>
                  <MaterialCommunityIcons name={modeIconName} size={18} color={colors.neutral[700]} />
                  <Text style={styles.metricValue}>{minDurationDisplay}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {currentSheetState !== 'min' ? (
          <View style={styles.expandedContainer}>
            <ScrollView
              style={styles.sheetContent}
              contentContainerStyle={styles.sheetScrollContent}
              showsVerticalScrollIndicator={false}
              scrollEnabled={currentSheetState === 'max' && dynamicMaxSheetHeight >= MAX_SHEET_HEIGHT - 1}
              onContentSizeChange={(_, height) => setExpandedContentHeight(height)}
            >
              {routeError ? (
                <Text style={styles.errorText}>{routeError}</Text>
              ) : null}

              {/* Turn-by-turn directions */}
              {steps.length > 0 ? (
                <View style={styles.stepsSection}>
                  <Text style={styles.stepsTitle}>Directions</Text>
                  {steps.map((step, index) => (
                    <View key={`${index}-${step.instruction}`} style={styles.stepRow}>
                      <View style={styles.stepIcon}>
                        <MaterialCommunityIcons 
                          name={getDirectionIcon(step.instruction) as any} 
                          size={22} 
                          color={colors.neutral[700]} 
                        />
                      </View>
                      <View style={styles.stepContent}>
                        <Text style={styles.stepInstruction}>
                          {step.instruction || 'Continue straight'}
                        </Text>
                        {step.distanceText ? (
                          <Text style={styles.stepDistance}>{step.distanceText}</Text>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}
            </ScrollView>
          </View>
        ) : null}
      </Animated.View>
    </Animated.View>
  );
}

