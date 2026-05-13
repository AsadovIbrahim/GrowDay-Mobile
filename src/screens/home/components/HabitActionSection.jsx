import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, PermissionsAndroid, Platform, Alert, Animated, Easing } from 'react-native';
import { useMMKVString } from 'react-native-mmkv';
import Geolocation from 'react-native-geolocation-service';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faPlay, faPause, faStop, faPlus, faKeyboard, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Modal, TextInput, Vibration } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { completeUserHabitFetch, reportHabitProgressFetch } from '../../../utils/fetch';
import { useTheme } from '../../../context/ThemeContext';
import { displayOngoingHabitNotification, cancelOngoingHabitNotification, scheduleIncompleteReminder, cancelIncompleteReminder } from '../../../utils/NotificationService';
import { isStepCountingSupported, startStepCounterUpdate, stopStepCounterUpdate } from '@dongminyu/react-native-step-counter';
import { useTranslation } from "react-i18next";

const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

const HabitActionSection = ({ habit, token, note, date, onActionComplete, onLiveUpdate, isFuture }) => {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const { t } = useTranslation();
    const { colors } = theme;
    const hId = habit.userHabitId || habit.UserHabitId || habit.id;
    const startKey = `timer_start_${hId}`;
    const accKey = `timer_acc_${hId}`;
    const distKey = `dist_acc_${hId}`;
    const latKey = `last_lat_${hId}`;
    const lonKey = `last_lon_${hId}`;
    
    const [storedStart, setStoredStart] = useMMKVString(startKey);
    const [storedAcc, setStoredAcc] = useMMKVString(accKey);
    const [storedDist, setStoredDist] = useMMKVString(distKey);
    const [storedLat, setStoredLat] = useMMKVString(latKey);
    const [storedLon, setStoredLon] = useMMKVString(lonKey);

    const [timerActive, setTimerActive] = useState(!!storedStart);
    const [seconds, setSeconds] = useState(0);
    const [distance, setDistance] = useState(0);

    const [isReporting, setIsReporting] = useState(false);
    const [stepCount, setStepCount] = useState(0);
    const [showManualModal, setShowManualModal] = useState(false);
    const [manualValue, setManualValue] = useState("");

    const watchId = useRef(null);
    const lastPos = useRef({ lat: null, lon: null });
    const totalDistRef = useRef(0);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const autoStopTriggered = useRef(false);
    const blockUpdates = useRef(false);

    const unit = habit.unit?.toLowerCase();

    // Pulse animation when timer is active
    useEffect(() => {
        if (timerActive) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
                ])
            ).start();
        } else {
            pulseAnim.stopAnimation();
            pulseAnim.setValue(1);
        }
    }, [timerActive]);

    useEffect(() => {
        if (!timerActive) return;
        
        const currentVal = habit.currentValue || 0;
        const targetVal = habit.targetValue || 1;
        
        let currentDelta = isDistance ? distance : (seconds / 60);
        if (isDistance && unit === "m") currentDelta = distance * 1000;
        if (!isDistance && (unit === "hour" || unit === "hr" || unit === "hrs" || unit === "hours")) currentDelta = seconds / 3600;

        if (currentVal + currentDelta >= targetVal && !autoStopTriggered.current) {
            autoStopTriggered.current = true;
            handleStop();
        }
    }, [distance, seconds, timerActive]);

    const isBoolean = useMemo(() => !habit.unit || !habit.targetValue || habit.targetValue <= 0, [habit]);
    const isDuration = useMemo(() => ["minute","minutes", "hour","hours", "min", "hr", "mins", "hrs"].includes(unit), [unit]);
    const isDistance = useMemo(() => ["km", "m", "mile", "miles"].includes(unit), [unit]);
    const isSteps = useMemo(() => unit === "steps", [unit]);
    const isNumeric = useMemo(() => !isBoolean && !isDuration && !isDistance && !isSteps, [isBoolean, isDuration, isDistance, isSteps]);

    // Strict mode: habits are only actionable on their scheduled days
    const isScheduledOnSelectedDay = useMemo(() => {
        const freq = (habit.frequency || habit.frequencyType || '').toLowerCase();
        
        // If no specific date is provided, we assume today (which is always actionable unless future check fails)
        if (!date) return true;
        
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        const startDate = new Date(habit.startDate || habit.createdAt);
        startDate.setHours(0, 0, 0, 0);

        const endDate = habit.endDate ? new Date(habit.endDate) : null;
        if (endDate) endDate.setHours(0, 0, 0, 0);

        // 1. Check date range
        if (targetDate < startDate) return false;
        if (endDate && targetDate > endDate) return false;
        
        // 2. Check frequency
        if (freq === 'weekly') {
            if (!habit.selectedDays) return true;
            const dayMap = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };
            const dayAbbrev = dayMap[targetDate.getDay()];
            const scheduled = habit.selectedDays.split(',').map(d => d.trim());
            return scheduled.includes(dayAbbrev);
        }

        if (freq === 'monthly') {
            // Standard monthly: same day of month as start date
            return targetDate.getDate() === startDate.getDate();
        }

        if (freq === 'custom') {
            const interval = parseInt(habit.selectedDays, 10) || 1;
            const diffTime = targetDate.getTime() - startDate.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            return diffDays >= 0 && diffDays % interval === 0;
        }
        
        return true;
    }, [habit.frequency, habit.frequencyType, habit.selectedDays, habit.startDate, habit.createdAt, habit.endDate, date]);

    // Initial sync from MMKV to Refs
    useEffect(() => {
        if (storedLat) lastPos.current.lat = parseFloat(storedLat);
        if (storedLon) lastPos.current.lon = parseFloat(storedLon);
        
        const initialDist = parseFloat(storedDist || "0");
        totalDistRef.current = initialDist;
        setDistance(initialDist);
        if (isDistance) onLiveUpdate?.(initialDist);

        const initialAcc = parseInt(storedAcc || "0", 10);
        if (isDuration && initialAcc > 0) {
            const unitMod = (unit === "hour" || unit === "hr" || unit === "hrs" || unit === "hours") ? 3600 : 60;
            onLiveUpdate?.(initialAcc / unitMod);
        }
    }, []);

    useEffect(() => {
        let interval;
        const syncTime = () => {
            const acc = parseInt(storedAcc || "0", 10);
            let total = acc;
            if (storedStart) {
                const start = new Date(storedStart).getTime();
                const now = new Date().getTime();
                total += Math.floor((now - start) / 1000);
            }
            if (isDuration && !isReporting && !blockUpdates.current) {
                const unitMod = (unit === "hour" || unit === "hr" || unit === "hrs" || unit === "hours") ? 3600 : 60;
                onLiveUpdate?.(total / unitMod);
            }
            setSeconds(Math.max(0, total));
        };
        syncTime();
        if (storedStart) interval = setInterval(syncTime, 1000);
        return () => clearInterval(interval);
    }, [storedStart, storedAcc]);

    // Sync Ongoing Notification
    useEffect(() => {
        if (timerActive || (seconds > 0 || distance > 0 || stepCount > 0)) {
            const displayVal = isSteps ? `${stepCount} ${t("habit_details.action.steps")}` : (isDistance ? distance : null);
            displayOngoingHabitNotification(habit, seconds, displayVal, !timerActive);
        } else {
            cancelOngoingHabitNotification(hId);
        }
        
        return () => {
            if (!timerActive && seconds === 0) cancelOngoingHabitNotification(hId);
        };
    }, [timerActive, seconds, distance, stepCount]);

    useEffect(() => {
        if ((isDistance || isSteps) && timerActive) startTracking();
        else stopTracking();
        return () => stopTracking();
    }, [isDistance, isSteps, timerActive]);

    const requestPermissions = async () => {
        if (Platform.OS === 'ios') return true;
        try {
            console.log("Requesting permissions for unit:", unit);
            const permissions = [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
            
            // ACTIVITY_RECOGNITION is for Android 10+
            if (isSteps && Platform.Version >= 29) {
                permissions.push(PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION);
            }
            
            const granted = await PermissionsAndroid.requestMultiple(permissions);
            
            const locGranted = granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
            const actGranted = Platform.Version >= 29 
                ? granted[PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION] === PermissionsAndroid.RESULTS.GRANTED
                : true; // Older versions don't need runtime permission

            console.log("Permissions status:", { locGranted, actGranted });
            return isSteps ? actGranted : locGranted;
        } catch (err) { 
            console.log("Permission Error:", err);
            return false; 
        }
    };

    const startTracking = async () => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        if (isDistance) {
            console.log("Starting GPS Tracking...");
            watchId.current = Geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    if (lastPos.current.lat !== null && lastPos.current.lon !== null) {
                        const traveled = getDistance(lastPos.current.lat, lastPos.current.lon, latitude, longitude);
                        if (traveled > 0.002) {
                            totalDistRef.current += traveled;
                            setDistance(totalDistRef.current);
                            setStoredDist(totalDistRef.current.toFixed(4));
                            if (!isReporting && !blockUpdates.current) onLiveUpdate?.(totalDistRef.current);
                        }
                    }
                    lastPos.current = { lat: latitude, lon: longitude };
                    setStoredLat(latitude.toString());
                    setStoredLon(longitude.toString());
                },
                (error) => console.log("GPS Error:", error.message),
                { enableHighAccuracy: true, distanceFilter: 0, interval: 3000, fastestInterval: 2000 }
            );
        }

        if (isSteps) {
            console.log("Checking Pedometer support...");
            isStepCountingSupported().then(({ supported, granted }) => {
                console.log("Pedometer supported:", supported, "granted:", granted);
                if (supported && granted) {
                    console.log("Starting Pedometer updates...");
                    const now = new Date();
                    watchId.current = startStepCounterUpdate(now, (data) => {
                        console.log("Pedometer Data Received:", data);
                        const count = data.steps || 0;
                        setStepCount(count);
                        if (!isReporting && !blockUpdates.current) onLiveUpdate?.(count);
                    });
                } else {
                    Alert.alert("Not Supported", "Your device does not support hardware step counting or permission was denied.");
                }
            }).catch(err => {
                console.warn("Pedometer check error:", err);
            });
        }
    };

    const stopTracking = () => {
        if (isDistance && watchId.current !== null) {
            Geolocation.clearWatch(watchId.current);
            watchId.current = null;
        }
        if (isSteps) {
            try {
                if (watchId.current && typeof watchId.current.remove === 'function') {
                    watchId.current.remove();
                }
                stopStepCounterUpdate();
            } catch (e) {
                console.log("Error stopping pedometer:", e);
            }
            watchId.current = null;
        }
        lastPos.current = { lat: null, lon: null };
        setStoredLat(undefined);
        setStoredLon(undefined);
    };

    const handleStartResume = () => {
        blockUpdates.current = false;
        setStoredStart(new Date().toISOString());
        setTimerActive(true);
    };

    const handlePause = () => {
        if (!storedStart) return;
        const diff = Math.floor((new Date().getTime() - new Date(storedStart).getTime()) / 1000);
        const newAcc = parseInt(storedAcc || "0", 10) + diff;
        setStoredAcc(newAcc.toString());
        setStoredStart(undefined);
        setTimerActive(false);
        
        // They paused but haven't finished, so schedule a reminder
        scheduleIncompleteReminder(habit);
    };

    const handleStop = async () => {
        const acc = parseInt(storedAcc || "0", 10);
        let totalTime = acc + (storedStart ? Math.floor((new Date().getTime() - new Date(storedStart).getTime()) / 1000) : 0);
        
        let delta = isDistance ? totalDistRef.current : (totalTime / 60);
        if (isSteps) delta = stepCount;
        if (isDistance && unit === "m") delta *= 1000;
        if (!isDistance && !isSteps && (unit === "hour" || unit === "hr" || unit === "hrs" || unit === "hours")) delta = totalTime / 3600;

        // Validation: Allow 1+ unit
        if (isSteps ? (stepCount < 1) : (isDistance ? (delta < (unit === "km" ? 0.001 : 1)) : (totalTime < 1))) {
            console.log("Session too short");
            cleanup();
            return;
        }

        const success = await handleReportProgress(delta, "device", totalTime);
        if (success) cleanup();
        else console.log("Report failed, keeping data for retry.");
    };

    const cleanup = () => {
        blockUpdates.current = true;
        setStoredStart(undefined); setStoredAcc("0"); setStoredDist("0");
        setStoredLat(undefined); setStoredLon(undefined);
        totalDistRef.current = 0; setDistance(0); setStepCount(0);
        setTimerActive(false); stopTracking();
        cancelOngoingHabitNotification(hId);
        autoStopTriggered.current = false;
    };



    const handleReportProgress = async (delta, source = "manual", durationInSec = 0) => {
        try {
            setIsReporting(true);
            const hId = habit.userHabitId || habit.UserHabitId || habit.id;
            const payload = { 
                userHabitId: hId, 
                deltaValue: delta, 
                source, 
                note, 
                timestamp: new Date().toISOString(),
                date: date,
                actualDuration: durationInSec > 0 ? Math.round(durationInSec / 60) : null
            };
            const result = await reportHabitProgressFetch(token, payload);
            if (result.success) {
                onActionComplete();


                const totalProgress = (habit.currentValue ?? 0) + delta;
                if (totalProgress >= (habit.targetValue ?? 1) && (habit.currentValue ?? 0) < (habit.targetValue ?? 1)) {
                    cancelIncompleteReminder(habit);
                    const updatedHabit = { ...habit, currentValue: totalProgress };
                    navigation.navigate("HabitCelebration", { habit: updatedHabit });
                } else if (totalProgress < (habit.targetValue ?? 1)) {
                    // Partially completed, set a reminder to finish later
                    scheduleIncompleteReminder(habit);
                }
                return true;
            }
            return false;
        } catch (e) { 
            console.error("Report error:", e); 
            return false;
        } finally {
            setIsReporting(false);
        }
    };

    const formatTime = (s) => {
        const hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
        return (unit === "hour" || unit === "hr" || unit === "hrs" || unit === "hours") ? `${hh}:${mm < 10 ? '0' : ''}${mm}:${ss < 10 ? '0' : ''}${ss}` : `${mm}:${ss < 10 ? '0' : ''}${ss}`;
    };

    const formatDistance = (km) => unit === "m" ? `${(km * 1000).toFixed(0)} m` : `${km.toFixed(2)} km`;

    // Prevent any action for future dates
    if (isFuture) {
        return (
            <View style={[styles.lockedBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.lockedEmoji]}>⏳</Text>
                <Text style={[styles.lockedTitle, { color: colors.text }]}>
                    {t("habit_details.action.upcoming_title")}
                </Text>
                <Text style={[styles.lockedSub, { color: colors.textSecondary }]}>
                    {t("habit_details.action.upcoming_sub")}
                </Text>
            </View>
        );
    }

    // Strict schedule check
    if (!isScheduledOnSelectedDay) {
        const targetDate = new Date(date);
        const dayMap = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };
        const dayAbbrev = dayMap[targetDate.getDay()];
        
        const freq = (habit.frequency || habit.frequencyType || '').toLowerCase();
        let scheduleText = '';
        
        if (freq === 'weekly') {
            const scheduledDays = habit.selectedDays ? habit.selectedDays.split(',').map(d => d.trim()).join(', ') : '';
            scheduleText = t("habit_details.action.runs_on", { days: scheduledDays });
        } else if (freq === 'monthly') {
            const start = new Date(habit.startDate || habit.createdAt);
            scheduleText = t("habit_details.action.runs_monthly", { day: start.getDate() });
        } else if (freq === 'custom') {
            scheduleText = t("habit_details.action.runs_custom", { interval: habit.selectedDays });
        }

        const startDate = new Date(habit.startDate || habit.createdAt);
        startDate.setHours(0,0,0,0);
        if (targetDate < startDate) {
            scheduleText = t("habit_details.action.starts_on", { date: startDate.toLocaleDateString() });
        }

        return (
            <View style={[styles.lockedBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.lockedEmoji]}>🔒</Text>
                <Text style={[styles.lockedTitle, { color: colors.text }]}>
                    {t("habit_details.action.not_scheduled_title")}
                </Text>
                <Text style={[styles.lockedSub, { color: colors.textSecondary }]}>
                    {t("habit_details.action.not_scheduled_sub", { day: t(`habit_details.days_short.${dayAbbrev.toLowerCase()}`), scheduleText })}
                </Text>
            </View>
        );
    }

    if (isBoolean) return (
        <TouchableOpacity onPress={async () => {
            const hId = habit.userHabitId || habit.UserHabitId || habit.id;
            const res = await completeUserHabitFetch(token, hId, { note, date });
            if (res.success) {
                onActionComplete();
                navigation.navigate("HabitCelebration", { habit });
            } else {
                Alert.alert("Error", res.message || "Failed to complete habit.");
            }
        }} style={[styles.mainBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.btnText}>{t("habit_details.action.mark_done")}</Text>
        </TouchableOpacity>
    );

    if (isNumeric) {
        const isCompleted = (habit.progressPercentage >= 100) || ((habit.currentValue ?? 0) >= (habit.targetValue ?? 0));
        if (isCompleted) {
            return null;
        }
        let incs = [1, 2, 5];
        if (unit === "ml") incs = [100, 250, 500];
        if (unit === "count") incs = [1, 5, 10];
        if (unit === "pages") incs = [1, 5, 10];

        const handleIncrement = (val) => {
            Vibration.vibrate(10); // Subtle haptic-like vibration
            onLiveUpdate?.(prev => prev + val);
            handleReportProgress(val);
        };

        const handleManualSubmit = () => {
            const val = parseFloat(manualValue);
            if (!isNaN(val) && val > 0) {
                onLiveUpdate?.(prev => prev + val);
                handleReportProgress(val);
                setShowManualModal(false);
                setManualValue("");
                Vibration.vibrate(20);
            }
        };

        return (
            <View style={styles.numericContainer}>
                <View style={styles.incrementsRow}>
                    {incs.map(inc => (
                        <TouchableOpacity 
                            key={inc} 
                            onPress={() => handleIncrement(inc)} 
                            disabled={isReporting}
                            activeOpacity={0.7}
                            style={[styles.incBtn, { backgroundColor: colors.card, borderColor: colors.primary, opacity: isReporting ? 0.6 : 1 }]}
                        >
                            <Text style={[styles.incText, { color: colors.primary }]}>+{inc}</Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity 
                        onPress={() => {
                            Vibration.vibrate(15);
                            setShowManualModal(true);
                        }} 
                        disabled={isReporting}
                        activeOpacity={0.7}
                        style={[styles.incBtn, styles.manualBtn, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
                    >
                        <FontAwesomeIcon icon={faKeyboard} color={colors.primary} size={18} />
                    </TouchableOpacity>
                </View>
                <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                    {t("habit_details.action.tap_to_add", { unit: habit.unit })}
                </Text>

                {/* Manual Entry Modal */}
                <Modal
                    visible={showManualModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowManualModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>{t("habit_details.action.log_progress")}</Text>
                                <TouchableOpacity onPress={() => setShowManualModal(false)}>
                                    <FontAwesomeIcon icon={faTimes} color={colors.textSecondary} size={20} />
                                </TouchableOpacity>
                            </View>
                            
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={[styles.manualInput, { color: colors.text, borderColor: colors.border }]}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor={colors.textMuted}
                                    autoFocus
                                    value={manualValue}
                                    onChangeText={setManualValue}
                                />
                                <Text style={[styles.unitText, { color: colors.textSecondary }]}>{habit.unit}</Text>
                            </View>

                            <TouchableOpacity 
                                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                                onPress={handleManualSubmit}
                            >
                                <Text style={styles.submitBtnText}>{t("common.save")}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </View>
        );
    }

    if (isDuration || isDistance || isSteps) {
        const isCompleted = (habit.progressPercentage >= 100) || ((habit.currentValue ?? 0) >= (habit.targetValue ?? 0));
        
        // If not active and reached goal, hide action section
        if (isCompleted && !timerActive && seconds === 0 && distance === 0 && stepCount === 0) {
            return null;
        }

        return (
            <View style={styles.durationContainer}>
                <Animated.View style={[
                    styles.timerDisplay, 
                    (isDistance || isSteps) && styles.workoutDisplay,
                    { transform: [{ scale: pulseAnim }], borderColor: timerActive ? colors.primary : colors.border, borderWidth: timerActive ? 1.5 : 1, backgroundColor: colors.card }
                ]}>
                    <Text style={[styles.sessionLabel, { color: colors.textSecondary }]}>{t("habit_details.action.today_session")}</Text>
                    <Text style={[styles.timerValue, { color: colors.text }]}>
                        {isSteps ? `${stepCount} ${t("units.steps")}` : (isDistance ? formatDistance(distance) : formatTime(seconds))}
                    </Text>
                    <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>
                        {isSteps ? t("habit_details.action.live_steps") : (isDistance ? t("habit_details.action.live_distance") : (["hour", "hr", "hrs", "hours"].includes(unit) ? "HRS:MIN:SEC" : "MIN:SEC"))}
                    </Text>
                    {(isDistance || isSteps) && <Text style={[styles.subTimer, { color: colors.textMuted }]}>{formatTime(seconds)}</Text>}
                </Animated.View>
                <View style={styles.controlsRow}>
                    {!timerActive ? (
                        <TouchableOpacity onPress={handleStartResume} style={[styles.controlBtn, styles.startBtn, { backgroundColor: colors.primary }]}>
                            <FontAwesomeIcon icon={faPlay} color="#fff" size={20} />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={handlePause} style={[styles.controlBtn, styles.pauseBtn]}>
                            <FontAwesomeIcon icon={faPause} color="#fff" size={20} />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={handleStop} style={[styles.controlBtn, styles.stopBtn]}>
                        <FontAwesomeIcon icon={faStop} color="#fff" size={20} />
                    </TouchableOpacity>
                </View>
                {timerActive && (
                    <Text style={[styles.activeHint, { color: colors.primary }]}>
                        {isDistance ? t("habit_details.action.location_active") : (isSteps ? t("habit_details.action.step_sensor_active") : t("habit_details.action.session_started"))}
                    </Text>
                )}
            </View>
        );
    }
    return null;
};

const styles = StyleSheet.create({
    mainBtn: { backgroundColor: "#2f6f3f", borderRadius: 16, paddingVertical: 16, alignItems: "center", width: "100%", elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, marginBottom: 16 },
    btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
    numericContainer: { alignItems: 'center', gap: 16, width: '100%', marginTop: 8, marginBottom: 16 },
    incrementsRow: { flexDirection: 'row', gap: 12, width: '100%', justifyContent: 'center' },
    incBtn: { backgroundColor: '#fff', borderColor: '#2f6f3f', borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20, minWidth: 80, alignItems: 'center' },
    incText: { fontSize: 18, fontWeight: '700', color: '#2f6f3f' },
    helperText: { fontSize: 13, color: '#6b7280', fontStyle: 'italic' },
    durationContainer: { alignItems: 'center', gap: 24, marginBottom: 20 },
    timerDisplay: { 
        alignItems: 'center', 
        backgroundColor: '#fff', 
        paddingVertical: 18, 
        paddingHorizontal: 24, 
        borderRadius: 16, 
        width: '100%', 
        borderWidth: 1, 
        borderColor: '#e5e7eb',
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6
    },
    workoutDisplay: { paddingVertical: 14 },
    sessionLabel: { fontSize: 11, fontWeight: '800', color: '#6b7280', letterSpacing: 1.5, marginBottom: 8 },
    timerValue: { fontSize: 44, fontWeight: '800', color: '#111827', fontVariant: ['tabular-nums'] },
    subTimer: { fontSize: 16, fontWeight: '600', color: '#4b5563', marginTop: -2 },
    timerLabel: { fontSize: 10, fontWeight: '600', color: '#6b7280', letterSpacing: 1, marginTop: 2 },
    controlsRow: { flexDirection: 'row', gap: 20, width: '100%', justifyContent: 'center', marginTop: 12 },
    controlBtn: { width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center", elevation: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 4 },
    startBtn: { backgroundColor: "#2f6f3f" },
    pauseBtn: { backgroundColor: "#f59e0b" },
    stopBtn: { backgroundColor: "#ef4444" },
    activeHint: { fontSize: 12, color: '#2f6f3f', fontWeight: '600' },
    lockedBanner: {
        borderRadius: 16,
        borderWidth: 1,
        paddingVertical: 24,
        paddingHorizontal: 20,
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
        marginBottom: 16,
        width: '100%',
    },
    lockedEmoji: { fontSize: 32, marginBottom: 4 },
    lockedTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
    lockedSub: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
    manualBtn: { paddingHorizontal: 16, minWidth: 60 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, elevation: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '700' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 12 },
    manualInput: { flex: 1, height: 60, borderWidth: 2, borderRadius: 16, paddingHorizontal: 20, fontSize: 24, fontWeight: '600' },
    unitText: { fontSize: 18, fontWeight: '600' },
    submitBtn: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 4 },
    submitBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});

HabitActionSection.displayName = "HabitActionSection";

export default HabitActionSection;
