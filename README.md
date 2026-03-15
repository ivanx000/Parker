# Parker

**Never forget where you parked again.**

Parker is an iOS app that saves your parking spot with one tap, then guides you back to your car with turn-by-turn walking directions.

![Platform](https://img.shields.io/badge/platform-iOS-black?style=flat-square)
![Expo](https://img.shields.io/badge/expo-54-blue?style=flat-square&logo=expo)
![React Native](https://img.shields.io/badge/react--native-0.81-61dafb?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

</div>

---

## Features

- **One-tap parking save** — Captures your exact GPS coordinates the moment you park
- **Turn-by-turn walking directions** — Powered by Google Maps, guiding you back on foot
- **Distance tracker** — Shows real-time distance to your saved spot
- **Usage tiers** — Free plan (10 navigations/month) and Pro plan (unlimited)
- **Subscription management** — In-app purchase and restore via RevenueCat
- **Smooth onboarding** — Intro, feature highlights, and plan selection screens
- **Persistent storage** — Your spot is saved locally across sessions

---

## Tech Stack

### Mobile (`app/`)

| | Technology |
|---|---|
| Framework | [Expo](https://expo.dev) ~54 / React Native 0.81 |
| Language | TypeScript 5.9 |
| Navigation & maps | [react-native-maps](https://github.com/react-native-maps/react-native-maps) + Google Maps |
| Location | [expo-location](https://docs.expo.dev/versions/latest/sdk/location/) |
| Subscriptions | [RevenueCat](https://www.revenuecat.com/) (react-native-purchases + react-native-purchases-ui) |
| Icons | [Lucide React Native](https://lucide.dev) |
| Animations | [Lottie](https://airbnb.io/lottie/) |
| Storage | [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/) |

### Backend (`backend/`)

| | Technology |
|---|---|
| Runtime | Python 3.9+ |
| Framework | [FastAPI](https://fastapi.tiangolo.com) |
| Directions | Google Directions API |
| Caching | In-memory (cachetools, 5-minute TTL) |
| Rate limiting | 5 req/min, 200 req/month per user |
| Server | Uvicorn |

---

## Project Structure

```
parker/
├── app/                        ← Expo React Native mobile app
│   ├── app/
│   │   └── (onboarding)/       ← Onboarding screens (welcome, features, paywall)
│   ├── assets/
│   │   └── animations/         ← Lottie animation files
│   ├── components/             ← Reusable UI components
│   │   ├── Card.tsx
│   │   ├── NavigationScreen.tsx
│   │   ├── RevenueCatPaywall.tsx
│   │   ├── SettingsScreen.tsx
│   │   └── ...
│   ├── hooks/
│   │   ├── useNavigationLimit.ts   ← Free/Pro usage enforcement
│   │   └── useParkingSpot.ts       ← GPS save/load logic
│   ├── lib/
│   │   ├── design-system.ts        ← Tokens (colors, spacing, typography)
│   │   ├── location.ts             ← Location permission helpers
│   │   ├── revenuecat.ts           ← Billing service (RevenueCat)
│   │   └── storage.ts              ← AsyncStorage wrapper
│   ├── types/
│   │   └── parking.ts              ← Shared TypeScript types
│   ├── App.tsx                     ← App root
│   ├── app.json                    ← Expo config
│   └── .env.example                ← Required environment variables (template)
├── backend/
│   ├── main.py                 ← FastAPI server (POST /route)
│   └── requirements.txt
├── package.json                ← Root monorepo scripts
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** v18+
- **npm** v9+
- **Xcode** (for iOS simulator / device builds, macOS only)
- **Python** 3.9+ (for backend)
- **Expo CLI**: `npm install -g expo-cli`

### 1. Clone & install

```bash
git clone https://github.com/your-username/parker.git
cd parker
npm install       # installs root deps
cd app && npm install && cd ..
```

### 2. Configure environment variables

```bash
cp app/.env.example app/.env
```

Open `app/.env` and fill in your values:

```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:8000

# Google Maps — https://console.cloud.google.com/
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here

# RevenueCat — https://app.revenuecat.com/
EXPO_PUBLIC_REVENUECAT_API_KEY=your_key_here
EXPO_PUBLIC_RC_ENTITLEMENT_ID=Parker Pro
EXPO_PUBLIC_RC_MONTHLY_PRODUCT_ID=monthly
EXPO_PUBLIC_RC_OFFERING_ID=Default
```

### 3. Build & run (iOS)

Parker uses native modules (RevenueCat, Maps, Location) that require a native build — **Expo Go is not supported**.

```bash
cd app

# Generate native iOS/Android projects
npx expo prebuild --clean

# Build & launch on iOS simulator
npx expo run:ios

# Build & launch on a connected physical device
npx expo run:ios --device
```

After the initial build, you can use the dev server for faster iteration:

```bash
npx expo start --dev-client
```

### 4. Run the backend (optional)

The backend provides the walking directions API. It's optional if you use the Google Maps SDK directly.

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs available at `http://localhost:8000/docs`.

---

## Available Scripts

Run these from the **root** of the repo:

```bash
npm run dev           # Start Expo dev server (inside app/)
npm run dev:ios       # Build and run on iOS simulator
npm run dev:android   # Build and run on Android emulator
npm run backend       # Start FastAPI backend
npm run lint          # TypeScript type check (app/)
```

## Important Workflow Note

- This repo's mobile app lives in `app/`.
- Run Expo through root proxy scripts (`npm run dev`, `npm run dev:ios`, `npm run dev:android`) or run Expo commands from inside `app/`.
- Do **not** run Expo commands from repo root directly (for example `npx expo run:ios` at root), because that can generate/use the wrong native project and cause build errors.

---

## Subscription Tiers

| | Free | Pro |
|---|---|---|
| Monthly navigations | 10 | Unlimited |
| Parking spot save | ✅ | ✅ |
| Walking directions | ✅ | ✅ |
| Distance tracking | ✅ | ✅ |
| Price | Free | Monthly subscription |

Subscription purchases are handled by [RevenueCat](https://www.revenuecat.com/). The native paywall and Customer Center UI are rendered by `react-native-purchases-ui`.

---

## Configuration

### RevenueCat Setup

1. Create a project in the [RevenueCat dashboard](https://app.revenuecat.com/)
2. Create an entitlement named **`Parker Pro`**
3. Create a product and attach it to the entitlement
4. Create an offering named **`Default`** and add your product to it
5. Copy your **iOS API key** into `EXPO_PUBLIC_REVENUECAT_API_KEY` in `app/.env`

### Google Maps Setup

1. Enable the **Maps SDK for iOS**, **Maps SDK for Android**, and **Directions API** in [Google Cloud Console](https://console.cloud.google.com/)
2. Add the key to `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` in `app/.env`
3. The key is also embedded in `app/app.json` under `ios.config.googleMapsApiKey` and `android.config.googleMaps.apiKey` for native map rendering

---

## Contributing

1. Fork the repo and create your branch: `git checkout -b feature/my-feature`
2. Commit your changes: `git commit -m 'feat: add my feature'`
3. Push to your branch: `git push origin feature/my-feature`
4. Open a pull request

---

## License

This project is licensed under the [MIT License](LICENSE).
