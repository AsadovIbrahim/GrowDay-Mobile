import { storage } from './MMKVStore';
import { reportHabitProgressFetch } from './fetch';
import { cancelOngoingHabitNotification, cancelGoalReachedNotification } from './NotificationService';

export const syncActiveHabitTimers = async (habits, token, dateStr, navigation = null, onComplete = null) => {
    if (!habits || !Array.isArray(habits) || !token) return;

    let navigatedToCelebration = false;

    for (const habit of habits) {
        const hId = habit.userHabitId || habit.UserHabitId || habit.id;
        if (!hId) continue;

        const celebrateKey = `celebrate_${hId}_${dateStr}`;
        if (storage.getString(celebrateKey) === 'true') {
            storage.delete(celebrateKey);
            storage.delete(`timer_start_${hId}_${dateStr}`);
            storage.delete(`timer_acc_${hId}_${dateStr}`);
            storage.delete(`dist_acc_${hId}_${dateStr}`);
            storage.delete(`last_lat_${hId}_${dateStr}`);
            storage.delete(`last_lon_${hId}_${dateStr}`);
            storage.delete(`timer_target_${hId}_${dateStr}`);
            storage.delete(`timer_unit_${hId}_${dateStr}`);
            storage.delete(`pending_stop_${hId}_${dateStr}`);

            try {
                const { NativeModules } = require('react-native');
                if (NativeModules.RNSound && typeof NativeModules.RNSound.stopAllPlayers === 'function') {
                    NativeModules.RNSound.stopAllPlayers();
                }
            } catch (e) {
                console.log('[HabitTimerSync] Error calling native stopAllPlayers:', e);
            }

            if (navigation && !navigatedToCelebration) {
                navigatedToCelebration = true;
                const updatedHabit = { ...habit, currentValue: habit.targetValue || 1 };
                navigation.navigate("HabitCelebration", { habit: updatedHabit });
            }

            if (onComplete) {
                onComplete();
            }
            continue;
        }

        const startKey = `timer_start_${hId}_${dateStr}`;
        const accKey = `timer_acc_${hId}_${dateStr}`;

        const storedStart = storage.getString(startKey);
        if (!storedStart) continue;

        const startTime = new Date(storedStart).getTime();
        const acc = parseInt(storage.getString(accKey) || '0', 10);
        const totalTime = acc + Math.floor((Date.now() - startTime) / 1000);

        const currentVal = habit.currentValue || 0;
        const cachedTarget = storage.getString(`timer_target_${hId}_${dateStr}`);
        const cachedUnit = storage.getString(`timer_unit_${hId}_${dateStr}`);

        const targetVal = habit.targetValue !== undefined && habit.targetValue !== null
            ? habit.targetValue
            : (cachedTarget ? parseFloat(cachedTarget) : 1);

        const unit = (habit.unit !== undefined && habit.unit !== null
            ? habit.unit
            : (cachedUnit || '')).toLowerCase();

        const isDuration = ["minute", "minutes", "hour", "hours", "min", "hr", "mins", "hrs"].includes(unit);
        const isDistance = ["km", "m", "mile", "miles"].includes(unit);
        const isSteps = unit === "steps";
        const isKcal = ["kcal", "cal", "calories"].includes(unit);

        let currentDelta = 0;
        if (isDistance) {
            const distKey = `dist_acc_${hId}_${dateStr}`;
            currentDelta = parseFloat(storage.getString(distKey) || "0");
            if (unit === "m") currentDelta = currentDelta * 1000;
        } else if (isSteps) {
            currentDelta = 0; // Steps require sensor tracking
        } else if (isKcal) {
            currentDelta = totalTime * (6.5 / 60);
        } else if (isDuration) {
            const unitMod = (unit === "hour" || unit === "hr" || unit === "hrs" || unit === "hours") ? 3600 : 60;
            currentDelta = totalTime / unitMod;
        } else {
            // Default to duration if not specified
            currentDelta = totalTime / 60;
        }

        const totalProgress = currentVal + currentDelta;
        if (totalProgress >= targetVal) {
            // Target is reached! Report progress to auto-complete.
            // Cap delta to report so progress is exactly 100% (or capped)
            const deltaToReport = Math.max(0, targetVal - currentVal);
            if (deltaToReport > 0) {
                console.log(`[HabitTimerSync] Habit ${habit.title} reached goal in background. Syncing and completing...`);
                try {
                    const payload = {
                        userHabitId: hId,
                        deltaValue: deltaToReport,
                        source: "device",
                        note: "",
                        timestamp: new Date().toISOString(),
                        date: dateStr,
                        actualDuration: Math.round(totalTime / 60)
                    };
                    const result = await reportHabitProgressFetch(token, payload);
                    if (result.success) {
                        // Clear keys
                        storage.delete(startKey);
                        storage.delete(accKey);
                        storage.delete(`dist_acc_${hId}_${dateStr}`);
                        storage.delete(`last_lat_${hId}_${dateStr}`);
                        storage.delete(`last_lon_${hId}_${dateStr}`);
                        storage.delete(`timer_target_${hId}_${dateStr}`);
                        storage.delete(`timer_unit_${hId}_${dateStr}`);

                        // Cancel notifications
                        await cancelOngoingHabitNotification(hId);
                        await cancelGoalReachedNotification(hId);

                        // Trigger native focus sound stop just in case
                        try {
                            const { NativeModules } = require('react-native');
                            if (NativeModules.RNSound && typeof NativeModules.RNSound.stopAllPlayers === 'function') {
                                NativeModules.RNSound.stopAllPlayers();
                            }
                        } catch (e) {
                            console.log('[HabitTimerSync] Error calling native stopAllPlayers:', e);
                        }

                        // Celebrate!
                        if (navigation && !navigatedToCelebration) {
                            navigatedToCelebration = true;
                            const updatedHabit = { ...habit, currentValue: currentVal + deltaToReport };
                            navigation.navigate("HabitCelebration", { habit: updatedHabit });
                        }

                        if (onComplete) {
                            onComplete();
                        }
                    }
                } catch (e) {
                    console.error(`[HabitTimerSync] Failed to report progress for habit ${hId}:`, e);
                }
            }
        }
    }
};
