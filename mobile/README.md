# RentalMan Mobile

Native iOS & Android app for RentalMan, built with Expo + React Native + TypeScript.
Talks to the same backend as the web app: `https://rentalman.online/api/v1`.

## Stack
- **Expo SDK 56** (React Native, New Architecture)
- **TypeScript**
- **React Navigation** — bottom tabs (Dashboard, Tenants, Units, Payments, Expenses) + auth stack
- **expo-secure-store** — JWT stored in iOS Keychain / Android Keystore (never AsyncStorage)
- **axios** — API client with 15s timeout, token interceptor, 401 auto-clear

## Project structure
```
src/
├── api/index.ts            REST client + all endpoint wrappers
├── context/AuthContext.tsx Session state, SecureStore, token expiry check
├── components/ui.tsx       Card, Button, Input, Badge, Loader, etc.
├── navigation/
│   ├── RootNavigator.tsx   Switches auth <-> app based on token
│   ├── AuthNavigator.tsx   Login / Register / ForgotPassword
│   └── AppNavigator.tsx    Bottom tab bar
├── screens/
│   ├── auth/               LoginScreen, RegisterScreen, ForgotPasswordScreen
│   ├── DashboardScreen.tsx Metrics, occupancy, upcoming payments
│   ├── TenantsScreen.tsx   List + search + create/edit/delete modal
│   ├── UnitsScreen.tsx     Property cards + create/edit/delete
│   ├── PaymentsScreen.tsx  Summary counts + record-payment flow
│   └── ExpensesScreen.tsx  Expense list + total + create/edit/delete
└── theme/index.ts          Colors, spacing, radius, font tokens
```

## Run locally
```bash
npm install
npx expo start          # scan QR with Expo Go app, or press i / a
```

Override the API URL for local backend testing:
```bash
EXPO_PUBLIC_API_URL=http://192.168.1.50:8000/api/v1 npx expo start
```
(Use your machine's LAN IP, not localhost — the phone can't reach localhost.)

## Build for stores
```bash
npm install -g eas-cli
eas login
eas build:configure

# Internal test builds
eas build --platform android --profile preview   # produces an APK
eas build --platform ios --profile preview       # needs Apple Developer account

# Production store builds
eas build --platform all --profile production
eas submit --platform android
eas submit --platform ios
```

## Notes
- `EXPO_PUBLIC_API_URL` is baked into the bundle at build time (it's a public URL, not a secret).
- Bundle identifier / package: `com.rentalman.app`
- App icon and splash: replace files in `assets/` before production build.
