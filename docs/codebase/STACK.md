# Technology Stack

## Runtime Summary

| Area | Value | Evidence |
|------|-------|----------|
| Active mobile app | Expo SDK 58 / React Native 0.88 / React 19.3 / TypeScript 6.0 | `apps/mobile-rn/package.json` |
| Mobile entry point | `expo` registration through `index.ts`, then `App.tsx` | `apps/mobile-rn/package.json`, `apps/mobile-rn/index.ts` |
| API | NestJS 11.2, Prisma Client 6.12, PostgreSQL | `apps/api/package.json`, `apps/api/prisma/schema.prisma` |
| API runtime | Node.js 24 in Docker; CommonJS output targeting ES2023 | `apps/api/Dockerfile`, `apps/api/tsconfig.json` |
| Package manager | npm with committed lockfiles | `apps/mobile-rn/package-lock.json`, `apps/api/package-lock.json` |
| Reference client | Flutter/Dart retained as a migration reference | `README.md`, `apps/mobile/pubspec.yaml` |

## Production Frameworks and Dependencies

| Dependency | Version | Role | Evidence |
|------------|---------|------|----------|
| Expo | `~58.0.17` | Native app runtime and build tooling | `apps/mobile-rn/package.json` |
| React Navigation | 7.x | Stack and bottom-tab navigation | `apps/mobile-rn/package.json`, `apps/mobile-rn/src/navigation/RootNavigator.tsx` |
| expo-auth-session / expo-web-browser | 58.x | Google OAuth browser flow | `apps/mobile-rn/src/screens/auth/SignInScreen.tsx` |
| expo-camera / expo-image-picker | 58.x | Meal camera and photo-library capture | `apps/mobile-rn/src/screens/scan/CameraScreen.tsx` |
| expo-blur | `~58.0.5` | Translucent glass navigation surface | `apps/mobile-rn/src/components/BottomNav.tsx` |
| NestJS | 11.2 | API modules, validation, routing, DI | `apps/api/package.json`, `apps/api/src/app.module.ts` |
| Prisma | 6.x | PostgreSQL schema and data access | `apps/api/prisma/schema.prisma` |
| google-auth-library | 11.3 | Google ID-token verification | `apps/api/src/auth/google-verifier.ts` |
| Node `crypto.scrypt` | Node 24 built-in | Salted password hashing and constant-time verification | `apps/api/src/auth/password.ts` |

## Development Toolchain

| Tool | Purpose | Evidence |
|------|---------|----------|
| TypeScript | Strict typechecking for both TypeScript apps | `apps/mobile-rn/tsconfig.json`, `apps/api/tsconfig.json` |
| ESLint | Lint gates | `apps/mobile-rn/eslint.config.js`, `apps/api/eslint.config.mjs` |
| Vitest | React Native domain tests | `apps/mobile-rn/package.json` |
| Jest / ts-jest | API unit and e2e suites | `apps/api/jest.config.js`, `apps/api/test/jest-e2e.json` |
| GitHub Actions | APK/IPA artifacts and release publication | `.github/workflows/react-native-artifacts.yml` |

## Key Commands

```powershell
cd apps/mobile-rn; npm ci; npm run typecheck; npm run lint; npm test
cd apps/api; npm ci; npm run lint; npm run build; npx prisma validate; npm test
cd apps/api; npm run test:e2e
```

## Environment and Config

- Mobile: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`, `EXPO_PUBLIC_RELEASE_URL`.
- API: `DATABASE_URL`, `CORS_ORIGINS`, `JWT_SECRET`, `GOOGLE_CLIENT_IDS`, `AI_PROVIDER`, `AI_BASE_URL`, `AI_API_KEY`, and SMS provider settings.
- The release workflow reads the API URL and Google client IDs from GitHub repository variables.

## Evidence

- `apps/mobile-rn/package.json`
- `apps/api/package.json`
- `apps/mobile-rn/.env.example`
- `apps/api/.env.example`
- `.github/workflows/react-native-artifacts.yml`
