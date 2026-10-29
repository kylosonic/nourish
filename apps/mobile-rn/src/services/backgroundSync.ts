import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import {
  loadAppData,
  loadSession,
  saveAppData,
  saveSession,
} from '../state/storage';
import { syncAccountData } from './sync';

export const BACKGROUND_SYNC_TASK = 'nourish-background-sync';

if (!TaskManager.isTaskDefined(BACKGROUND_SYNC_TASK)) {
  TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
    try {
      const network = await NetInfo.fetch();
      if (!network.isConnected) {
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }
      const [session, data] = await Promise.all([loadSession(), loadAppData()]);
      if (!session) return BackgroundFetch.BackgroundFetchResult.NoData;
      const result = await syncAccountData(session, data);
      await Promise.all([saveAppData(result.data), saveSession(result.session)]);
      return result.changed
        ? BackgroundFetch.BackgroundFetchResult.NewData
        : BackgroundFetch.BackgroundFetchResult.NoData;
    } catch {
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });
}

/** Registration is best-effort: foreground and reconnect sync still work. */
export async function registerBackgroundSync(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const status = await BackgroundFetch.getStatusAsync();
    if (status === BackgroundFetch.BackgroundFetchStatus.Denied) return;
    if (await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK)) return;
    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 15 * 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch {
    // OS scheduling is best-effort; reconnect/foreground sync remains active.
  }
}
