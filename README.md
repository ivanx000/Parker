<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Parker - Find Your Parked Car

Parker is a mobile application built with Expo and React Native that helps you remember and find your parked car location.

## 📱 Project Structure

This is a **monorepo** containing:

- **`app/`** - Main Expo React Native mobile application
- **`backend/`** - Python API server

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Python 3.9+ (for backend)

### Installation

```bash
# Install all dependencies
npm install

# For backend Python dependencies  
cd backend && pip install -r requirements.txt && cd ..
```

### Running the App

```bash
# Start Expo development server
npm run dev

# Run on iOS simulator (macOS only)
npm run dev:ios

# Run on Android emulator
npm run dev:android

# Run web version (experimental)
npm run dev:web
```

### Running the Backend

```bash
npm run backend
```

## 📁 Project Layout

See [STRUCTURE.md](./PROJECT_STRUCTURE.md) for detailed folder organization.

Quick overview:
```
parker/
├── app/                  ← Main mobile app (Expo/React Native)
│   ├── components/       ← React Native UI components
│   ├── hooks/           ← Custom React hooks
│   ├── lib/             ← Utility functions
│   ├── types/           ← TypeScript types
│   └── app/             ← Screen definitions
├── backend/             ← Python API server
├── package.json         ← Root monorepo config
└── README.md           ← This file
```

## 🔧 Available Scripts

From root directory:

```bash
npm install       # Install dependencies for app and backend
npm run dev       # Start Expo dev server
npm run dev:ios   # Run on iOS simulator
npm run dev:android # Run on Android emulator
npm run backend   # Start Python backend
npm run lint      # Lint app code
```

## 📱 Key Features

- 📍 Save parking location with GPS
- 🗺️ View location on Google Maps
- 📊 Navigation usage tracking with subscription tiers
- ⚙️ Settings and preferences
- 🎯 Onboarding experience

## 🔑 Configuration

### Environment Variables

Create local env files from the templates:

```bash
cp app/.env.example app/.env
cp backend/.env.example backend/.env
```

Set values in each file:

```
app/.env
EXPO_PUBLIC_BACKEND_URL=http://localhost:8000

backend/.env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### Google Maps API

Google Maps API key is configured in `app/app.json` for both iOS and Android.

## 🎨 Technology Stack

### Frontend (Mobile)
- **Expo** - React Native framework
- **React Native** - Mobile UI framework
- **TypeScript** - Type safety
- **React Navigation** - Navigation library
- **Async Storage** - Persistent storage
- **Lucide React Native** - Icons

### Backend
- **Python** - Server runtime
- **Express** (Node.js embedded) or **FastAPI/Flask** - Web framework
- **Better SQLite3** - Database

## 📖 Documentation

- [App Documentation](./app/README.md) - Mobile app details
- [Backend Documentation](./backend/README.md) - API documentation

## ⚠️ Migration Notes

This project was auto-converted from a **React web app (Vite)** to an **Expo React Native app**. 

**Work needed:**
- Convert web components to React Native components
- Replace Tailwind CSS with React Native StyleSheet
- Update imports (lucide-react → lucide-react-native)
- Adapt navigation implementation
- Update storage layer for React Native

See [app/README.md](./app/README.md) for detailed migration guide.

## 🗣️ Support

For issues with:
- **Expo**: See [Expo Docs](https://docs.expo.dev)
- **React Native**: See [React Native Docs](https://reactnative.dev)
- **This app**: Check the app/README.md and backend/README.md

## 📄 License

[Add your license here]
