import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, TriggerType } from '@notifee/react-native';
import { updateFcmTokenFetch } from './fetch';
import { storage } from './MMKVStore';
import i18n from '../localization/i18n'; // i18next instance birbaşa

// Helper: t() hook olmadan — utils içindən
const t = (key, opts) => i18n.t(key, opts);

export const requestUserPermission = async () => {
  const authStatus = await messaging().requestPermission();
  const fcmEnabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  const settings = await notifee.requestPermission();

  if (fcmEnabled && settings.authorizationStatus >= 1) {
    console.log('Notification permissions granted.');
    storage.set('settings.pushEnabled', true);
    return true;
  }

  if (authStatus === messaging.AuthorizationStatus.DENIED) {
    storage.set('settings.pushEnabled', false);
  }

  console.log('Notification permissions denied.');
  return false;
};

export const getFcmToken = async (token) => {
  try {
    const fcmToken = await messaging().getToken();
    const lang = storage.getString('userLanguage') || 'en';
    const timezoneOffset = new Date().getTimezoneOffset(); // Offset in minutes (e.g., -240 for UTC+4)
    if (fcmToken) {
      await updateFcmTokenFetch(token, `${fcmToken}||${lang}||${timezoneOffset}`);
      console.log('FCM Token Updated with Language and Timezone:', lang, timezoneOffset);
    }
  } catch (error) {
    console.log('FCM Token Error:', error);
  }
};

export const notificationListener = async () => {
  const unsubscribe = messaging().onMessage(async remoteMessage => {
    console.log('Foreground Message:', remoteMessage);
    await displayLocalNotification(remoteMessage);
  });

  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Background Message:', remoteMessage);
  });

  return unsubscribe;
};

export const displayLocalNotification = async (remoteMessage) => {
  const soundEnabled = storage.getBoolean('settings.soundEnabled') ?? true;
  const pushEnabled = storage.getBoolean('settings.pushEnabled') ?? true;

  if (!pushEnabled) return;

  const channelId = soundEnabled ? 'growday_sound_channel' : 'growday_silent_channel';

  await notifee.createChannel({
    id: channelId,
    name: soundEnabled ? t('notifications.channel_sound') : t('notifications.channel_silent'),
    importance: soundEnabled ? AndroidImportance.HIGH : AndroidImportance.DEFAULT,
    sound: soundEnabled ? 'default' : undefined,
    vibration: soundEnabled,
  });

  await notifee.displayNotification({
    title: remoteMessage.notification?.title || remoteMessage.data?.title || 'GrowDay',
    body: remoteMessage.notification?.body || remoteMessage.data?.body || '',
    android: {
      channelId: channelId,
      pressAction: { id: 'default' },
    },
  });
};

export const displayOngoingHabitNotification = async (habit, seconds, distance = null, isPaused = false, baseSeconds = 0, targetSeconds = null) => {
  const hId = habit.userHabitId || habit.UserHabitId || habit.id;
  const channelId = 'ongoing_habit_channel';

  await notifee.createChannel({
    id: channelId,
    name: t('notifications.channel_tracking'),
    importance: AndroidImportance.LOW,
  });

  const hh = Math.floor(seconds / 3600);
  const mm = Math.floor((seconds % 3600) / 60);
  const ss = seconds % 60;
  const timeStr = `${hh > 0 ? hh + ':' : ''}${mm < 10 ? '0' : ''}${mm}:${ss < 10 ? '0' : ''}${ss}`;

    let body = `${t('notifications.push_time_label')}: ${timeStr}`;
    if (distance !== null && distance !== '') {
        // distance is expected to be a pre-formatted string from the caller (e.g. "1.23 km" or "500 steps")
        body = `${distance}`;
    } else {
        // If it's just duration, we can let the chronometer handle the visual time
        body = '';
    }

  if (isPaused) {
    body = t('notifications.push_tracking_paused', { body: body || timeStr });
  }

  await notifee.displayNotification({
    id: `ongoing_${hId}`,
    title: t('notifications.push_tracking_title', { habit: habit.title }),
    body: body,
    data: {
      habitId: hId.toString(),
      type: 'ongoing_habit',
      title: habit.title || '',
      distance: distance ? distance.toString() : '',
      baseSeconds: baseSeconds.toString(),
      targetSeconds: targetSeconds ? targetSeconds.toString() : ''
    },
    android: {
      channelId: channelId,
      ongoing: true,
      autoCancel: false,
      onlyAlertOnce: true,
      showChronometer: !isPaused,
      timestamp: Date.now() - (seconds * 1000),
      actions: [
        {
          title: isPaused ? t('notifications.push_action_resume') : t('notifications.push_action_pause'),
          pressAction: { id: isPaused ? 'resume' : 'pause' },
        },
        {
          title: t('notifications.push_action_stop'),
          pressAction: { id: 'stop' },
        },
      ],
      pressAction: { id: 'default' },
    },
  });
};

export const cancelOngoingHabitNotification = async (hId) => {
  const id = hId.userHabitId || hId.UserHabitId || hId.id || hId;
  await notifee.cancelNotification(`ongoing_${id}`);
};

export const scheduleIncompleteReminder = async (habit) => {
  const pushEnabled = storage.getBoolean('settings.pushEnabled') ?? true;
  if (!pushEnabled) return;

  const hId = habit.userHabitId || habit.UserHabitId || habit.id;
  const triggerId = `reminder_${hId}`;

  await cancelIncompleteReminder(hId);

  const trigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: Date.now() + 1000 * 60 * 60 * 2, // 2 hours
  };

  const soundEnabled = storage.getBoolean('settings.soundEnabled') ?? true;
  const channelId = soundEnabled ? 'growday_reminder_channel_sound' : 'growday_reminder_channel_silent';
  
  await notifee.createChannel({
    id: channelId,
    name: t('notifications.channel_reminders'),
    importance: soundEnabled ? AndroidImportance.HIGH : AndroidImportance.DEFAULT,
    sound: soundEnabled ? 'default' : undefined,
    vibration: soundEnabled,
  });

  await notifee.createTriggerNotification(
    {
      id: triggerId,
      title: t('notifications.push_reminder_title', { habit: habit.title }),
      body: t('notifications.push_reminder_body'),
      data: {
        habitId: hId.toString(),
        type: 'reminder',
      },
      android: {
        channelId: channelId,
        pressAction: { id: 'default' },
      },
    },
    trigger
  );
  console.log(`Scheduled 2-hour reminder for incomplete habit: ${habit.title}`);
};

export const cancelIncompleteReminder = async (hId) => {
  const id = hId.userHabitId || hId.UserHabitId || hId.id || hId;
  await notifee.cancelTriggerNotification(`reminder_${id}`);
};

export const scheduleWinBackReminder = async () => {
  const pushEnabled = storage.getBoolean('settings.pushEnabled') ?? true;
  if (!pushEnabled) return;

  const triggerId = 'winback_7days';

  await notifee.cancelTriggerNotification(triggerId);

  const trigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
  };

  const soundEnabled = storage.getBoolean('settings.soundEnabled') ?? true;
  const channelId = soundEnabled ? 'growday_reminder_channel_sound' : 'growday_reminder_channel_silent';

  await notifee.createChannel({
    id: channelId,
    name: t('notifications.channel_reminders'),
    importance: soundEnabled ? AndroidImportance.HIGH : AndroidImportance.DEFAULT,
    sound: soundEnabled ? 'default' : undefined,
    vibration: soundEnabled,
  });

  await notifee.createTriggerNotification(
    {
      id: triggerId,
      title: t('notifications.push_winback_title'),
      body: t('notifications.push_winback_body'),
      data: { type: 'winback' },
      android: {
        channelId: channelId,
        pressAction: { id: 'default' },
      },
    },
    trigger
  );
  console.log(`Scheduled 7-day win-back reminder.`);
};

export const cancelWinBackReminder = async () => {
  await notifee.cancelTriggerNotification('winback_7days');
};

export const scheduleGoalReachedNotification = async (habit, timeRemainingSeconds) => {
  const pushEnabled = storage.getBoolean('settings.pushEnabled') ?? true;
  if (!pushEnabled || timeRemainingSeconds <= 0) return;

  const hId = habit.userHabitId || habit.UserHabitId || habit.id;
  
  await cancelGoalReachedNotification(hId);

  const trigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: Date.now() + (timeRemainingSeconds * 1000),
  };

  const soundEnabled = storage.getBoolean('settings.soundEnabled') ?? true;
  const channelId = soundEnabled ? 'growday_reminder_channel_sound' : 'growday_reminder_channel_silent';
  
  await notifee.createTriggerNotification({
    id: `ongoing_${hId}`, // Overwrites the ongoing notification
    title: "Goal Reached! 🎉",
    body: `You successfully reached your goal for ${habit.title || 'this habit'}! Tap to celebrate!`,
    data: {
      habitId: hId.toString(),
      type: 'goal_reached',
    },
    android: {
      channelId: channelId,
      pressAction: { id: 'default' },
      autoCancel: true,
    },
  }, trigger);
};

export const cancelGoalReachedNotification = async (hId) => {
  const id = hId.userHabitId || hId.UserHabitId || hId.id || hId;
  await notifee.cancelTriggerNotification(`ongoing_${id}`);
};
