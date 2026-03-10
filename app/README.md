# Parker - Expo React Native App

This is the main mobile application for Parker, built with Expo and React Native.

## Setup

This project is part of a monorepo. Dependencies are installed from the root:

```bash
npm install
```

## Running the App

From the root directory:

```bash
# Start the development server
npm run dev

# Run on iOS simulator
npm run dev:ios

# Run on Android emulator
npm run dev:android

# Run on web (experimental)
npm run dev:web
```

Or from the app directory:

```bash
expo start
```

## Project Structure

```
app/
├── App.tsx                 # Main app component
├── index.js               # Expo entry point
├── app.json              # Expo configuration (Google Maps API, etc)
├── babel.config.js       # Babel configuration
├── tsconfig.json         # TypeScript configuration
├── assets/               # App icons and splash screens
├── components/           # React Native components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and helpers
├── types/                # TypeScript type definitions
└── app/                  # App routing structure (onboarding screens)
```

## Important Notes

⚠️ **Web Components Migration Required**

This project was automatically converted from a React web app using Vite. The existing components are built for React DOM and need to be adapted to React Native. Key changes needed:

- Replace `<div>` with `<View>`
- Replace `<input>` with `<TextInput>`
- Replace Tailwind CSS with React Native StyleSheet
- Replace `lucide-react` icons with `lucide-react-native`
- Update async storage calls to use `@react-native-async-storage/async-storage`
- Replace web navigation with React Navigation

## Google Maps Integration

Google Maps API key is configured in `app.json` for both iOS and Android platforms. Update the key if needed.

## Backend Integration

The backend is located in `/backend` and runs separately. See the Backend README for setup instructions.

## Development Workflow

1. Install dependencies: `npm install`
2. Start development: `npm run dev`
3. Update components to use React Native APIs
4. Test on iOS simulator: `npm run dev:ios`
5. Test on Android emulator: `npm run dev:android`

## Building for Production

```bash
# Build for iOS
eas build --platform ios

# Build for Android  
eas build --platform android

# Build for both
eas build
```

(Requires EAS CLI setup)

## Common Issues

**Module not found errors**: The project was auto-converted from web to mobile. Install any missing dependencies from the app's package.json.

**Icons not found**: Install `lucide-react-native` and update component imports.

**Styling issues**: React Native doesn't support CSS. Convert Tailwind classes to StyleSheet styles.

For more information, see [Expo Documentation](https://docs.expo.dev)
