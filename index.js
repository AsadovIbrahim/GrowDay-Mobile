import 'react-native-gesture-handler';
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
            if (storedStart) {
                const diff = Math.floor((new Date().getTime() - new Date(storedStart).getTime()) / 1000);
                const currentAcc = parseInt(storage.getString(accKey) || '0', 10);
                storage.set(accKey, (currentAcc + diff).toString());
                storage.delete(startKey);
            }
        } else if (pressAction.id === 'resume') {
            storage.set(startKey, new Date().toISOString());
        } else if (pressAction.id === 'stop') {
            // Simply cancel notification for now, app will handle reporting when opened
            // or we could trigger a fetch here if needed
            await notifee.cancelNotification(notification.id);
            storage.delete(startKey);
            storage.set(accKey, '0');
            storage.set(`dist_acc_${hId}`, '0');
        }
    }
});

// Register foreground service (required for Android)
notifee.registerForegroundService((notification) => {
    return new Promise(() => {
        // This promise keeps the service running until it's cancelled
    });
});

AppRegistry.registerComponent(appName, () => App);
