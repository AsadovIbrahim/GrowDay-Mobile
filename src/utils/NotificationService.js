import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, TriggerType } from '@notifee/react-native';
import { updateFcmTokenFetch } from './fetch';
import { storage } from './MMKVStore';

export const requestUserPermission = async () => {
  // FCM Permission
  const authStatus = await messaging().requestPermission();
  const fcmEnabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  // Notifee Permission (Required for Android 13+)
  const settings = await notifee.requestPermission();
  
  if (fcmEnabled && settings.authorizationStatus >= 1) {
    console.log('Notification permissions granted.');
    storage.set('settings.pushEnabled', true); // Sync local UI state
    return true;
  }
  
  if (authStatus === messaging.AuthorizationStatus.DENIED) {
    storage.set('settings.pushEnabled', false); // Sync local UI state
  }

  console.log('Notification permissions denied.');
  return false;
};

export const getFcmToken = async (token) => {
  try {
    const fcmToken = await messaging().getToken();
    if (fcmToken) {
      console.log('FCM Token:', fcmToken);
      // Sync with backend
      await updateFcmTokenFetch(token, fcmToken);
      return fcmToken;
    }
  } catch (error) {
    console.log('Error getting FCM token:', error);
  }
};

export const notificationListener = async () => {
  // Foreground messages
  const unsubscribe = messaging().onMessage(async remoteMessage => {
    console.log('Foreground Message:', remoteMessage);
    await displayLocalNotification(remoteMessage);
  });

  // Background/Quit state messages
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Background Message:', remoteMessage);
  });

  return unsubscribe;
};

export const displayLocalNotification = async (remoteMessage) => {
  // Check if sound alerts are enabled
  const soundEnabled = storage.getBoolean('settings.soundEnabled') ?? true;
  const pushEnabled = storage.getBoolean('settings.pushEnabled') ?? true;

  if (!pushEnabled) return;

  // Create/Update channel
  const channelId = soundEnabled ? 'growday_sound_channel' : 'growday_silent_channel';
  
  await notifee.createChannel({
    id: channelId,
    name: soundEnabled ? 'Sound Notifications' : 'Silent Notifications',
    importance: AndroidImportance.HIGH,
    sound: soundEnabled ? 'default' : undefined,
  });

  // Display a notification
  await notifee.displayNotification({
    title: remoteMessage.notification?.title || remoteMessage.data?.title || 'GrowDay',
    body: remoteMessage.notification?.body || remoteMessage.data?.body || '',
    android: {
      channelId: channelId,
      pressAction: {
        id: 'default',
      },
    },
  });
};

export const displayOngoingHabitNotification = async (habit, seconds, distance = null, isPaused = false) => {
  const hId = habit.userHabitId || habit.UserHabitId || habit.id;
  const channelId = 'ongoing_habit_channel';
  
  await notifee.createChannel({
    id: channelId,
    name: 'Habit Tracking',
    importance: AndroidImportance.LOW, 
  });

  const hh = Math.floor(seconds / 3600), mm = Math.floor((seconds % 3600) / 60), ss = seconds % 60;
  const timeStr = `${hh > 0 ? hh + ':' : ''}${mm < 10 ? '0' : ''}${mm}:${ss < 10 ? '0' : ''}${ss}`;
  
  let body = `Time: ${timeStr}`;
  if (distance !== null) {
      const distStr = typeof distance === 'number' ? `${distance.toFixed(2)} km` : distance;
      body = `${distStr} | ${timeStr}`;
  }

  if (isPaused) {
    body = `(Paused) ${body}`;
  }

  await notifee.displayNotification({
    id: `ongoing_${hId}`,
    title: `Tracking: ${habit.title}`,
    body: body,
    data: {
      habitId: hId.toString(),
      type: 'ongoing_habit'
    },
    android: {
      channelId: channelId,
      ongoing: true, 
      autoCancel: false,
      onlyAlertOnce: true,
      asForegroundService: true,
      actions: [
        {
          title: isPaused ? 'Resume' : 'Pause',
          pressAction: { id: isPaused ? 'resume' : 'pause' },
        },
        {
          title: 'Stop',
          pressAction: { id: 'stop' },
        },
      ],
      pressAction: {
        id: 'default',
      },
    },
  });
};

export const cancelOngoingHabitNotification = async (hId) => {
  const id = hId.userHabitId || hId.UserHabitId || hId.id || hId;
  await notifee.cancelNotification(`ongoing_${id}`);
};

// Local Trigger Notification for Incomplete Habits
export const scheduleIncompleteReminder = async (habit) => {
  const pushEnabled = storage.getBoolean('settings.pushEnabled') ?? true;
  if (!pushEnabled) return;

  const hId = habit.userHabitId || habit.UserHabitId || habit.id;
  const triggerId = `reminder_${hId}`;

  // Cancel any existing reminder for this habit to reset the 2-hour timer
  await cancelIncompleteReminder(hId);

  // Set trigger for 2 hours from now
  const trigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: Date.now() + 1000 * 60 * 60 * 2, // 2 hours
  };

  const channelId = 'growday_reminder_channel';
  await notifee.createChannel({
    id: channelId,
    name: 'Habit Reminders',
    importance: AndroidImportance.DEFAULT,
  });

  await notifee.createTriggerNotification(
    {
      id: triggerId,
      title: `Keep going with ${habit.title}!`,
      body: `You left your habit incomplete. Tap to finish it now and keep your streak alive! 🔥`,
      data: {
        habitId: hId.toString(),
        type: 'reminder'
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

// --- WIN-BACK RETENTION CAMPAIGN ---
export const scheduleWinBackReminder = async () => {
  const pushEnabled = storage.getBoolean('settings.pushEnabled') ?? true;
  if (!pushEnabled) return;

  const triggerId = 'winback_7days';
  
  // Always clear the old one first
  await notifee.cancelTriggerNotification(triggerId);

  // Set trigger for 7 days from now
  const trigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 Days
  };

  const channelId = 'growday_reminder_channel';
  // (channel already created above, but safe to call createChannel again)
  await notifee.createChannel({
    id: channelId,
    name: 'Habit Reminders',
    importance: AndroidImportance.DEFAULT,
  });

  await notifee.createTriggerNotification(
    {
      id: triggerId,
      title: `Is everything okay? 👀`,
      body: `We haven't seen you around lately. Your habits miss you! 🚀`,
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
