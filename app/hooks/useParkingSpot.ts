import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { ParkingSpot } from '../types/parking';
import { storage } from '../lib/storage';
import { getDistance, requestLocationPermission, getCurrentLocation } from '../lib/location';

const STORAGE_KEY = 'parking_spot';

export function useParkingSpot() {
  const [spot, setSpot] = useState<ParkingSpot | null>(null);
  const [currentPos, setCurrentPos] = useState<{lat: number, lng: number} | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    let isActive = true;

    storage.getItem<ParkingSpot>(STORAGE_KEY).then(saved => {
      if (!isActive) return;
      if (saved) setSpot(saved);
    });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!spot) return;
    
    let watchId: Location.LocationSubscription | null = null;
    
    const setupWatcher = async () => {
      try {
        watchId = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 1000,
            distanceInterval: 1,
          },
          (location) => {
            setCurrentPos({ 
              lat: location.coords.latitude, 
              lng: location.coords.longitude 
            });
          }
        );
      } catch (err) {
        console.error('Error watching position:', err);
      }
    };
    
    setupWatcher();
    
    return () => {
      if (watchId) {
        watchId.remove();
      }
    };
  }, [spot]);

  const saveSpot = async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setError('Location permission denied');
      setIsSaving(false);
      return;
    }

    try {
      const location = await getCurrentLocation();
      const newSpot: ParkingSpot = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        accuracyMeters: location.coords.accuracy || 0,
        savedAtISO: new Date().toISOString()
      };
      
      await storage.setItem(STORAGE_KEY, newSpot);
      setSaveSuccess(true);
      
      setTimeout(() => {
        setSpot(newSpot);
        setTimeout(() => {
          setSaveSuccess(false);
        }, 500); // Reset success state after transition
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to get location');
    } finally {
      setIsSaving(false);
    }
  };

  const clearSpot = async () => {
    setSpot(null);
    setCurrentPos(null);
    await storage.removeItem(STORAGE_KEY);
  };

  const distance = spot && currentPos 
    ? getDistance(currentPos.lat, currentPos.lng, spot.lat, spot.lng) 
    : null;

  return { spot, currentPos, distance, isSaving, error, saveSuccess, saveSpot, clearSpot };
}
