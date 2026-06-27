import 'react-native-gesture-handler';
import './src/localization/i18n';
import { AppRegistry, Text, TextInput } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import notifee, { EventType } from '@notifee/react-native';
import { cssInterop } from 'nativewind';
import LinearGradient from 'react-native-linear-gradient';
import { storage } from './src/utils/MMKVStore';

cssInterop(LinearGradient, {
    className: 'style',
});

// Dynamic Font Fallback for Non-Latin Languages (Russian, Arabic, Chinese)
// This resolves font blending issues where some characters render in custom font and others fall back to system font.
const systemFontLanguages = ['ru', 'ar', 'zh'];

const patchFontFamily = (style, currentLanguage) => {
    if (!style) return style;
    if (!systemFontLanguages.includes(currentLanguage)) return style;

    const stripFont = (s) => {
        if (!s) return s;
        if (s.fontFamily && (s.fontFamily.includes('RedditSans') || s.fontFamily.includes('SFPRODISPLAY'))) {
            const { fontFamily, ...rest } = s;
            return rest;
        }
        return s;
    };

    if (Array.isArray(style)) {
        return style.map(s => patchFontFamily(s, currentLanguage));
    } else if (typeof style === 'object') {
        return stripFont(style);
    }
    return style;
};

const patchComponent = (Component) => {
    if (!Component) return;
    if (Component.render) {
        const originalRender = Component.render;
        Component.render = function (props, ref) {
            const currentLanguage = storage.getString('userLanguage') || 'en';
            if (systemFontLanguages.includes(currentLanguage)) {
                const newProps = {
                    ...props,
                    style: patchFontFamily(props.style, currentLanguage)
                };
                return originalRender.call(this, newProps, ref);
            }
            return originalRender.call(this, props, ref);
        };
    }
};

patchComponent(Text);
patchComponent(TextInput);

// Handle background events (when app is closed/background)
notifee.onBackgroundEvent(async ({ type, detail }) => {
    const { notification, pressAction } = detail;
    const hId = notification.data?.habitId;

    if (type === EventType.DELIVERED && notification?.data?.type === 'goal_reached' && hId) {
        const token = storage.getString('accessToken');
        if (token) {
            const targetVal = parseFloat(notification.data?.targetValue || '1');
            const currentVal = parseFloat(notification.data?.currentValue || '0');
            const unit = notification.data?.unit || '';
            const dateStr = notification.data?.dateStr || new Date().toISOString().split('T')[0];
            const startKey = `timer_start_${hId}_${dateStr}`;
            const accKey = `timer_acc_${hId}_${dateStr}`;

            const storedStart = storage.getString(startKey) || storage.getString(`timer_start_${hId}`);
            const acc = parseInt(storage.getString(accKey) || storage.getString(`timer_acc_${hId}`) || '0', 10);
            const totalTime = acc + (storedStart ? Math.floor((Date.now() - new Date(storedStart).getTime()) / 1000) : 0);

            const isDuration = ["minute", "minutes", "hour", "hours", "min", "hr", "mins", "hrs"].includes(unit.toLowerCase());
            const isDistance = ["km", "m", "mile", "miles"].includes(unit.toLowerCase());
            const isSteps = unit.toLowerCase() === "steps";
            const isKcal = ["kcal", "cal", "calories"].includes(unit.toLowerCase());

            let delta = 0;
            if (isDistance) {
                const distKey = `dist_acc_${hId}_${dateStr}`;
                delta = parseFloat(storage.getString(distKey) || "0");
                if (unit.toLowerCase() === "m") delta = delta * 1000;
            } else if (isSteps) {
                delta = 0;
            } else if (isKcal) {
                delta = totalTime * (6.5 / 60);
            } else if (isDuration) {
                const unitMod = (unit.toLowerCase() === "hour" || unit.toLowerCase() === "hr" || unit.toLowerCase() === "hrs" || unit.toLowerCase() === "hours") ? 3600 : 60;
                delta = totalTime / unitMod;
            } else {
                delta = totalTime / 60;
            }

            let deltaToReport = Math.max(0, Math.min(delta, targetVal - currentVal));
            if (notification?.data?.type === 'goal_reached') {
                deltaToReport = Math.max(deltaToReport, targetVal - currentVal);
            }

            if (deltaToReport > 0) {
                import('./src/utils/fetch').then(({ reportHabitProgressFetch }) => {
                    const payload = {
                        userHabitId: hId,
                        deltaValue: deltaToReport,
                        source: "device",
                        note: "",
                        timestamp: new Date().toISOString(),
                        date: dateStr,
                        actualDuration: Math.round(totalTime / 60)
                    };
                    reportHabitProgressFetch(token, payload).then(result => {
                        if (result.success) {
                            console.log(`[BackgroundEvent] Successfully auto-completed habit ${hId} in background.`);
                            storage.delete(startKey);
                            storage.delete(`timer_start_${hId}`);
                            storage.delete(accKey);
                            storage.delete(`timer_acc_${hId}`);
                            storage.delete(`dist_acc_${hId}_${dateStr}`);
                            storage.delete(`last_lat_${hId}_${dateStr}`);
                            storage.delete(`last_lon_${hId}_${dateStr}`);
                            storage.delete(`timer_target_${hId}_${dateStr}`);
                            storage.delete(`timer_unit_${hId}_${dateStr}`);
                            storage.set(`celebrate_${hId}_${dateStr}`, 'true');

                            // Cancel ongoing notification
                            import('./src/utils/NotificationService').then(({ cancelOngoingHabitNotification }) => {
                                cancelOngoingHabitNotification(hId);
                            });

                            // Trigger native sound stop if it hasn't stopped
                            try {
                                const { NativeModules } = require('react-native');
                                if (NativeModules.RNSound && typeof NativeModules.RNSound.stopAllPlayers === 'function') {
                                    NativeModules.RNSound.stopAllPlayers();
                                }
                            } catch (e) { }
                        }
                    }).catch(err => {
                        console.error(`[BackgroundEvent] Error auto-completing habit ${hId}:`, err);
                    });
                });
            }
        }
    }

    if (type === EventType.ACTION_PRESS && hId) {
        const dateStr = notification.data?.dateStr || new Date().toISOString().split('T')[0];
        const dateSuffix = dateStr ? `_${dateStr}` : '';
        const startKey = `timer_start_${hId}${dateSuffix}`;
        const accKey = `timer_acc_${hId}${dateSuffix}`;

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
                displayOngoingHabitNotification({ id: hId, title }, newAcc + baseSecs, distance, true, baseSecs, targetSecs, dateStr);
                cancelGoalReachedNotification(hId);
            });

        } else if (pressAction.id === 'resume') {
            storage.set(startKey, new Date().toISOString());

            // Cache targetValue and unit to MMKV
            const targetValue = notification.data?.targetValue || '1';
            const unit = notification.data?.unit || '';
            storage.set(`timer_target_${hId}${dateSuffix}`, targetValue);
            storage.set(`timer_unit_${hId}${dateSuffix}`, unit);

            const currentAcc = parseInt(storage.getString(accKey) || '0', 10);
            const baseSecs = parseInt(notification.data?.baseSeconds || '0', 10);
            const targetSecsStr = notification.data?.targetSeconds;
            const targetSecs = targetSecsStr ? parseInt(targetSecsStr, 10) : null;
            const title = notification.data?.title || '';
            const distance = notification.data?.distance || null;
            import('./src/utils/NotificationService').then(({ displayOngoingHabitNotification, scheduleGoalReachedNotification }) => {
                const totalCurrent = currentAcc + baseSecs;
                displayOngoingHabitNotification({ id: hId, title }, totalCurrent, distance, false, baseSecs, targetSecs, dateStr);

                if (targetSecs !== null) {
                    const remaining = targetSecs - totalCurrent;
                    if (remaining > 0) {
                        scheduleGoalReachedNotification({
                            id: hId,
                            title,
                            targetValue: notification.data?.targetValue ? parseFloat(notification.data.targetValue) : 1,
                            currentValue: notification.data?.currentValue ? parseFloat(notification.data.currentValue) : 0,
                            unit: notification.data?.unit || ''
                        }, remaining);
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
            storage.set(`pending_stop_${hId}${dateSuffix}`, true);
        }
    }
});

// Foreground service removed — using ongoing notification without asForegroundService to prevent ANR

AppRegistry.registerComponent(appName, () => App);
