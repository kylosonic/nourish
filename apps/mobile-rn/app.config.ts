import type { ConfigContext, ExpoConfig } from 'expo/config';
import appJson from './app.json';

/**
 * Expo evaluates this file at build time. `NOURISH_API_URL` is copied into the
 * embedded config so production builds cannot silently use an undeployed
 * placeholder host.
 *
 * REQUIRED BEFORE ANY PRODUCTION BUILD:
 *   export NOURISH_API_URL=https://your-api-host.com
 *   npx eas build --platform android --profile production
 *
 * The build will fail-fast if this variable is missing in CI, because an app
 * that cannot reach its API is not launchable.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const apiUrl =
    process.env.NOURISH_API_URL?.trim() ||
    process.env.EXPO_PUBLIC_API_URL?.trim() ||
    '';

  // Fail-fast in CI/production: an app without an API URL is not usable.
  if (process.env.CI && !apiUrl) {
    throw new Error(
      'NOURISH_API_URL (or EXPO_PUBLIC_API_URL) must be set before building. ' +
        'Example: export NOURISH_API_URL=https://your-api-host.com',
    );
  }

  return {
    ...config,
    ...appJson.expo,
    extra: {
      ...config.extra,
      ...appJson.expo.extra,
      apiUrl: apiUrl || null,
    },
  } as ExpoConfig;
};
