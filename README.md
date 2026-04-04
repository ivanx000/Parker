# Parker

Never forget where you parked again.

Parker is a React Native app (Expo SDK 54) that saves your parking spot and guides you back with walking directions.

## Features

- One-tap parking spot save using current GPS position
- Navigation back to your car with map route rendering
- Real-time distance/time display while navigating
- Free/Pro usage model (Free: 10 navigations/month, Pro: unlimited)
- RevenueCat paywall, purchase, and restore flow
- Local-first storage for parking spot and usage counters

## Tech Stack

Mobile app lives in `app/`.

| Area | Technology |
|---|---|
| Framework | Expo ~54 / React Native 0.81 |
| Language | TypeScript |
| Maps | `react-native-maps`, `react-native-maps-directions` |
| Location | `expo-location` |
| Billing | `react-native-purchases`, `react-native-purchases-ui` (RevenueCat) |
| Icons | `react-native-heroicons`, `@expo/vector-icons` |
| Storage | `@react-native-async-storage/async-storage` |
| Testing | Jest (`jest-expo`) |

## Repository Structure

```text
parker/
├── app/                # Expo React Native app
├── package.json        # Root proxy scripts
├── README.md
└── LICENSE
```

## Prerequisites

- Node.js 18+
- npm 9+
- Xcode (for iOS simulator/device builds)
- Android Studio (optional, for Android emulator builds)

## Setup

```bash
git clone <repo-url>
cd parker
npm install
npm run install:app
cp app/.env.example app/.env
```

Set required env vars in `app/.env`:

```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=...
EXPO_PUBLIC_REVENUECAT_API_KEY=...
EXPO_PUBLIC_RC_ENTITLEMENT_ID=Parker Pro
EXPO_PUBLIC_RC_MONTHLY_PRODUCT_ID=monthly
EXPO_PUBLIC_RC_OFFERING_ID=Default
```

## Run The App

From repo root:

```bash
npm run dev
npm run dev:ios
npm run dev:android
npm run dev:web
```

Or from `app/` directly:

```bash
cd app
npm run start
npm run ios
npm run android
```

Parker relies on native modules (maps, location, RevenueCat), so use a dev build (not plain Expo Go) when validating full subscription and map behavior.

## Testing

From `app/`:

```bash
npm run test
npm run test:watch
npm run test:ci
```

Current regression tests are in `app/__tests__/core.test.ts`.

## Configuration Notes

- Dynamic Expo config is defined in `app/app.config.js`.
- `app/app.json` currently contains basic Expo metadata (name/slug/scheme).

## License

MIT. See `LICENSE`.
