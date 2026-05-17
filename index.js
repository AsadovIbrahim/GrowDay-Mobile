import 'react-native-gesture-handler';
import './src/localization/i18n';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import notifee, { EventType } from '@notifee/react-native';

import { storage } from './src/utils/MMKVStore';

// Handle background events (when app is closed/background)
notifee.onBackgroundEvent(async ({ type, detail }) => {
    const { notification, pressAction } = detail;
    const hId = notification.data?.habitId;

    if (type === EventType.ACTION_PRESS && hId) {
        const startKey = `timer_start_${hId}`;
        const accKey = `timer_acc_${hId}`;

        if (pressAction.id === 'pause') {
            const storedStart = storage.getString(startKey);
            let newAcc = parseInt(storage.getString(accKey) || '0', 10);
            if (storedStart) {
                const diff = Math.floor((new Date().getTime() - new Date(storedStart).getTime()) / 1000);
                newAcc += diff;
                storage.set(accKey, newAcc.toString());
                storage.delete(startKey);
            }
            
            // Reconstruct and update the notification
            const baseSecs = parseInt(notification.data?.baseSeconds || '0', 10);
            const targetSecsStr = notification.data?.targetSeconds;
            const targetSecs = targetSecsStr ? parseInt(targetSecsStr, 10) : null;
            const title = notification.data?.title || '';
            const distance = notification.data?.distance || null;
            import('./src/utils/NotificationService').then(({ displayOngoingHabitNotification, cancelGoalReachedNotification }) => {
                displayOngoingHabitNotification({ id: hId, title }, newAcc + baseSecs, distance, true, baseSecs, targetSecs);
                cancelGoalReachedNotification(hId);
            });

        } else if (pressAction.id === 'resume') {
            storage.set(startKey, new Date().toISOString());
            
            const currentAcc = parseInt(storage.getString(accKey) || '0', 10);
            const baseSecs = parseInt(notification.data?.baseSeconds || '0', 10);
            const targetSecsStr = notification.data?.targetSeconds;
            const targetSecs = targetSecsStr ? parseInt(targetSecsStr, 10) : null;
            const title = notification.data?.title || '';
            const distance = notification.data?.distance || null;
            import('./src/utils/NotificationService').then(({ displayOngoingHabitNotification, scheduleGoalReachedNotification }) => {
                const totalCurrent = currentAcc + baseSecs;
                displayOngoingHabitNotification({ id: hId, title }, totalCurrent, distance, false, baseSecs, targetSecs);
                
                if (targetSecs !== null) {
                    const remaining = targetSecs - totalCurrent;
                    if (remaining > 0) {
                        scheduleGoalReachedNotification({ id: hId, title }, remaining);
                    }
                }
            });
            
        } else if (pressAction.id === 'stop') {
            await notifee.cancelNotification(notification.id);
            const storedStart = storage.getString(startKey);
            if (storedStart) {
                const diff = Math.floor((new Date().getTime() - new Date(storedStart).getTime()) / 1000);
                const currentAcc = parseInt(storage.getString(accKey) || '0', 10);
                storage.set(accKey, (currentAcc + diff).toString());
                storage.delete(startKey);
            }
            // Signal the UI to handle the report
            storage.set(`pending_stop_${hId}`, true);
        }
    }
});

// Foreground service removed — using ongoing notification without asForegroundService to prevent ANR

AppRegistry.registerComponent(appName, () => App);
