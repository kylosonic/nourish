import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import type { Settings } from '../types';
import {
  buildReminderSchedule,
  type ReminderScheduleInput,
} from '../domain/reminders';

const CHANNEL_ID = 'hydration-reminders';
const REMINDER_KIND = 'hydration-reminder';

export const hydrationReminderLabel = 'your chosen window';

export type ReminderSetupResult =
  | 'enabled'
  | 'disabled'
  | 'denied'
  | 'unsupported';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Hydration reminders',
    description: 'Gentle reminders to log water throughout the day.',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 180, 120, 180],
    lightColor: '#FF7F5C',
  });
}

async function cancelScheduledReminders(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const reminders = scheduled.filter(
    (request) => request.content.data?.kind === REMINDER_KIND,
  );
  await Promise.all(
    reminders.map((request) =>
      Notifications.cancelScheduledNotificationAsync(request.identifier),
    ),
  );
}

function scheduleSettings(settings: Settings): ReminderScheduleInput {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(now.getDate()).padStart(2, '0')}`;
  return {
    startMinutes: settings.reminderStartMinutes,
    endMinutes: settings.reminderEndMinutes,
    intervalMinutes: settings.reminderIntervalMinutes,
    today,
    goalMetToday: false,
    now,
  };
}

async function scheduleReminders(
  settings: Settings,
  goalMetToday: boolean,
): Promise<void> {
  await ensureChannel();
  const schedule = buildReminderSchedule({
    ...scheduleSettings(settings),
    goalMetToday,
  });
  for (const date of schedule) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Hydration check',
        body: 'A glass of water now can help you stay on track.',
        sound: 'default',
        color: '#FF7F5C',
        data: { kind: REMINDER_KIND },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
        channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined,
      },
    });
  }
}

export async function setHydrationReminders(
  enabled: boolean,
  settings: Settings,
): Promise<ReminderSetupResult> {
  if (Platform.OS === 'web') return 'unsupported';

  if (!enabled) {
    await cancelScheduledReminders();
    return 'disabled';
  }

  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) {
    permission = await Notifications.requestPermissionsAsync();
  }
  if (!permission.granted) return 'denied';

  await cancelScheduledReminders();
  try {
    await scheduleReminders(settings, false);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Hydration reminders are on',
        body: 'Your schedule is active. Reminders pause for the day once you reach your water goal.',
        sound: 'default',
        color: '#FF7F5C',
        data: { kind: 'hydration-reminder-confirmation' },
      },
      trigger: null,
    });
  } catch (error) {
    await cancelScheduledReminders();
    throw error;
  }
  return 'enabled';
}

export async function reconcileHydrationReminders(
  settings: Settings,
  currentWaterMl: number,
): Promise<ReminderSetupResult> {
  if (Platform.OS === 'web') return 'unsupported';
  if (!settings.remindersEnabled) {
    await cancelScheduledReminders();
    return 'disabled';
  }

  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return 'denied';

  await cancelScheduledReminders();
  await scheduleReminders(settings, currentWaterMl >= settings.waterTargetMl);
  return 'enabled';
}
