import { Platform } from 'react-native';
import * as Camera from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { requestNotificationPermission } from './notifications';

export type AppPermissionResult =
  | 'granted'
  | 'limited'
  | 'denied'
  | 'unavailable'
  | 'app-only';

export type AppPermissionResults = {
  camera: AppPermissionResult;
  photos: AppPermissionResult;
  notifications: AppPermissionResult;
};

const WEB_RESULT: AppPermissionResults = {
  camera: 'app-only',
  photos: 'app-only',
  notifications: 'app-only',
};

function resultFrom(response: {
  granted: boolean;
  status?: string;
  accessPrivileges?: 'all' | 'limited' | 'none';
}): AppPermissionResult {
  if (response.accessPrivileges === 'limited') return 'limited';
  if (response.granted) return 'granted';
  if (response.status === 'limited') return 'limited';
  if (response.status === 'denied') return 'denied';
  return 'unavailable';
}

async function safely(
  request: () => Promise<AppPermissionResult>,
): Promise<AppPermissionResult> {
  try {
    return await request();
  } catch {
    return 'unavailable';
  }
}

export async function requestAppPermissions(): Promise<AppPermissionResults> {
  if (Platform.OS === 'web') return WEB_RESULT;

  const camera = await safely(async () =>
    resultFrom(await Camera.Camera.requestCameraPermissionsAsync()),
  );
  const photos = await safely(async () =>
    resultFrom(await ImagePicker.requestMediaLibraryPermissionsAsync()),
  );
  const notifications = await safely(async () => {
    const result = await requestNotificationPermission();
    return result === 'granted' ? 'granted' : 'denied';
  });

  return { camera, photos, notifications };
}
