declare module 'react-native-maps-directions' {
  import * as React from 'react';

  type Coordinate = {
    latitude: number;
    longitude: number;
  };

  export interface MapViewDirectionsResult {
    coordinates: Coordinate[];
    distance: number;
    duration: number;
    fare?: unknown;
    waypointOrder?: number[];
    legs?: unknown[];
  }

  export interface MapViewDirectionsProps {
    origin: Coordinate | string;
    destination: Coordinate | string;
    apikey: string;
    mode?: 'DRIVING' | 'BICYCLING' | 'TRANSIT' | 'WALKING';
    waypoints?: Array<Coordinate | string>;
    strokeWidth?: number;
    strokeColor?: string;
    precision?: 'low' | 'high';
    timePrecision?: 'none' | 'now';
    optimizeWaypoints?: boolean;
    splitWaypoints?: boolean;
    resetOnChange?: boolean;
    onStart?: (params: { origin: string; destination: string; waypoints: string[] }) => void;
    onReady?: (result: MapViewDirectionsResult) => void;
    onError?: (errorMessage: string) => void;
    [key: string]: unknown;
  }

  export default class MapViewDirections extends React.Component<MapViewDirectionsProps> {}
}
