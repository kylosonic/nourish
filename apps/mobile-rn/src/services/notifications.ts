import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';

const CHANNEL_ID = 'hydration-reminders';
const REMINDER_KIND = 'hydration-reminder';

export const hydrationReminderHours = [10, 14, 18] as const;
export const hydrationReminderLabel = '10:00, 14:00, and 18:00';

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
    lightColor: '#006C49',
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

async function scheduleDailyReminders(): Promise<void> {
  await ensureChannel();
  for (const hour of hydrationReminderHours) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Hydration check',
        body: 'A glass of water now can help you stay on track.',
        sound: 'default',
        color: '#006C49',
        data: { kind: REMINDER_KIND, hour },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute: 0,
        channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined,
      },
    });
  }
}

export async function setHydrationReminders(
  enabled: boolean,
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
    await scheduleDailyReminders();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Hydration reminders are on',
        body: `We’ll remind you at ${hydrationReminderLabel}.`,
        sound: 'default',
        color: '#006C49',
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
  enabled: boolean,
): Promise<ReminderSetupResult> {
  if (Platform.OS === 'web') return 'unsupported';
  if (!enabled) {
    await cancelScheduledReminders();
    return 'disabled';
  }

  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return 'denied';

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const existing = scheduled.filter(
    (request) => request.content.data?.kind === REMINDER_KIND,
  );
  if (existing.length === hydrationReminderHours.length) return 'enabled';

  await cancelScheduledReminders();
  await scheduleDailyReminders();
  return 'enabled';
}
