# Parker App (Expo React Native)

This directory contains Parker's mobile app built with Expo + React Native.

## Setup

Install dependencies in this app directory:

```bash
cd /Users/ivanxie/Developer/parker/app
npm install
```

Copy env template and set values:

```bash
cp .env.example .env
```

Required variables:

```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=...
EXPO_PUBLIC_REVENUECAT_API_KEY=...
EXPO_PUBLIC_RC_ENTITLEMENT_ID=Parker Pro
EXPO_PUBLIC_RC_MONTHLY_PRODUCT_ID=monthly
EXPO_PUBLIC_RC_OFFERING_ID=Default
```

## Running The App

From this directory:

```bash
npm run start
npm run ios
npm run android
npm run web
```

From repo root (proxy scripts):

```bash
npm run dev
npm run dev:ios
npm run dev:android
npm run dev:web
```

## Testing

Unit tests are configured with Jest (`jest-expo`) under:

```text
__tests__/
```

Run tests from this directory:

```bash
npm run test
npm run test:watch
npm run test:ci
```

Direct Jest command:

```bash
npx jest --runInBand --no-watchman
```

## Lint / Type Check

```bash
npm run lint
```

## Current Project Structure

```text
app/
├── App.tsx
├── index.js
├── app.config.js
├── app.json
├── __tests__/
├── app/(onboarding)/
├── assets/
├── components/
├── hooks/
├── lib/
├── types/
├── ios/
└── android/
```

## Configuration Notes

- Dynamic Expo config is defined in `app.config.js`.
- `app.json` currently contains basic metadata (name, slug, scheme).
- Maps/location/subscription features require native dev builds for full validation.

## Build for Production

```bash
eas build --platform ios
eas build --platform android
```
