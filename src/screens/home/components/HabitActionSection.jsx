import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, PermissionsAndroid, Platform, Alert, Animated, Easing } from 'react-native';
import { useMMKVString } from 'react-native-mmkv';
import Geolocation from 'react-native-geolocation-service';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faPlay, faPause, faStop } from '@fortawesome/free-solid-svg-icons';
import { useNavigation } from '@react-navigation/native';
import { completeUserHabitFetch, reportHabitProgressFetch } from '../../../utils/fetch';
import { useTheme } from '../../../context/ThemeContext';

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

const HabitActionSection = ({ habit, token, note, date, onActionComplete, onLiveUpdate }) => {
    const navigation = useNavigation();
    const { theme } = useTheme();
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

    const watchId = useRef(null);
    const lastPos = useRef({ lat: null, lon: null });
    const totalDistRef = useRef(0);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const autoStopTriggered = useRef(false);

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
    const isNumeric = useMemo(() => !isBoolean && !isDuration && !isDistance, [isBoolean, isDuration, isDistance]);

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
            if (isDuration) {
                const unitMod = (unit === "hour" || unit === "hr" || unit === "hrs" || unit === "hours") ? 3600 : 60;
                onLiveUpdate?.(total / unitMod);
            }
            setSeconds(Math.max(0, total));
        };
        syncTime();
        if (storedStart) interval = setInterval(syncTime, 1000);
        return () => clearInterval(interval);
    }, [storedStart, storedAcc]);

    useEffect(() => {
        if (isDistance && timerActive) startTracking();
        else stopTracking();
        return () => stopTracking();
    }, [isDistance, timerActive]);

    const requestLocationPermission = async () => {
        if (Platform.OS === 'ios') return true;
        try {
            const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (err) { return false; }
    };

    const startTracking = async () => {
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) return;

        console.log("Starting GPS Tracking with Refs...");
        
        watchId.current = Geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                console.log("GPS received:", latitude, longitude);

                if (lastPos.current.lat !== null && lastPos.current.lon !== null) {
                    const traveled = getDistance(lastPos.current.lat, lastPos.current.lon, latitude, longitude);
                    console.log("Traveled:", traveled, "KM");

                    if (traveled > 0.002) { // > 2 meters
                        totalDistRef.current += traveled;
                        const newTotal = totalDistRef.current;
                        setDistance(newTotal);
                        setStoredDist(newTotal.toFixed(4));
                        onLiveUpdate?.(newTotal);
                        console.log("New Total:", newTotal);
                    }
                }

                lastPos.current = { lat: latitude, lon: longitude };
                setStoredLat(latitude.toString());
                setStoredLon(longitude.toString());
            },
            (error) => console.log("GPS Error:", error.message),
            { enableHighAccuracy: true, distanceFilter: 0, interval: 3000, fastestInterval: 2000 }
        );
    };

    const stopTracking = () => {
        if (watchId.current !== null) {
            Geolocation.clearWatch(watchId.current);
            watchId.current = null;
        }
        lastPos.current = { lat: null, lon: null };
        setStoredLat(undefined);
        setStoredLon(undefined);
    };

    const handleStartResume = () => {
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
    };

    const handleStop = async () => {
        const acc = parseInt(storedAcc || "0", 10);
        let totalTime = acc + (storedStart ? Math.floor((new Date().getTime() - new Date(storedStart).getTime()) / 1000) : 0);
        
        let delta = isDistance ? totalDistRef.current : (totalTime / 60);
        if (isDistance && unit === "m") delta *= 1000;
        if (!isDistance && (unit === "hour" || unit === "hr" || unit === "hrs" || unit === "hours")) delta = totalTime / 3600;

        // Validation
        if (isDistance ? (delta < (unit === "km" ? 0.01 : 10)) : (totalTime < 60)) {
            console.log("Session too short");
            cleanup();
            return;
        }

        const success = await handleReportProgress(delta, "device", totalTime);
        if (success) cleanup();
        else console.log("Report failed, keeping data for retry.");
    };

    const cleanup = () => {
        setStoredStart(undefined); setStoredAcc("0"); setStoredDist("0");
        setStoredLat(undefined); setStoredLon(undefined);
        totalDistRef.current = 0; setDistance(0);
        setTimerActive(false); stopTracking();
        autoStopTriggered.current = false;
    };

    const handleReportProgress = async (delta, source = "manual", durationInSec = 0) => {
        try {
            const hId = habit.userHabitId || habit.UserHabitId || habit.id;
            const payload = { 
                userHabitId: hId, 
                deltaValue: delta, 
                source, 
                note, 
                timestamp: new Date().toISOString(),
                date: date,
                actualDuration: durationInSec > 0 ? Math.max(1, Math.floor(durationInSec / 60)) : null
            };
            const result = await reportHabitProgressFetch(token, payload);
            if (result.success) {
                onActionComplete();
                const totalProgress = (habit.currentValue ?? 0) + delta;
                if (totalProgress >= (habit.targetValue ?? 1) && (habit.currentValue ?? 0) < (habit.targetValue ?? 1)) {
                    const updatedHabit = { ...habit, currentValue: totalProgress };
                    navigation.navigate("HabitCelebration", { habit: updatedHabit });
                }
                return true;
            }
            return false;
        } catch (e) { 
            console.error("Report error:", e); 
            return false;
        }
    };

    const formatTime = (s) => {
        const hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
        return (unit === "hour" || unit === "hr" || unit === "hrs" || unit === "hours") ? `${hh}:${mm < 10 ? '0' : ''}${mm}:${ss < 10 ? '0' : ''}${ss}` : `${mm}:${ss < 10 ? '0' : ''}${ss}`;
    };

    const formatDistance = (km) => unit === "m" ? `${(km * 1000).toFixed(0)} m` : `${km.toFixed(2)} km`;

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
            <Text style={styles.btnText}>Mark as done</Text>
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
        return <View style={styles.numericContainer}><View style={styles.incrementsRow}>{incs.map(inc => <TouchableOpacity key={inc} onPress={() => handleReportProgress(inc)} style={[styles.incBtn, { backgroundColor: colors.card, borderColor: colors.primary }]}><Text style={[styles.incText, { color: colors.primary }]}>+{inc}</Text></TouchableOpacity>)}</View><Text style={[styles.helperText, { color: colors.textSecondary }]}>Tap to add {habit.unit}</Text></View>;
    }

    if (isDuration || isDistance) {
        const isCompleted = (habit.progressPercentage >= 100) || ((habit.currentValue ?? 0) >= (habit.targetValue ?? 0));
        
        // If not active and reached goal, hide action section
        if (isCompleted && !timerActive && seconds === 0 && distance === 0) {
            return null;
        }

        return (
            <View style={styles.durationContainer}>
                <Animated.View style={[
                    styles.timerDisplay, 
                    isDistance && styles.workoutDisplay,
                    { transform: [{ scale: pulseAnim }], borderColor: timerActive ? colors.primary : colors.border, borderWidth: timerActive ? 1.5 : 1, backgroundColor: colors.card }
                ]}>
                    <Text style={[styles.sessionLabel, { color: colors.textSecondary }]}>TODAY SESSION</Text>
                    <Text style={[styles.timerValue, { color: colors.text }]}>
                        {isDistance ? formatDistance(distance) : formatTime(seconds)}
                    </Text>
                    <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>
                        {isDistance ? "LIVE DISTANCE" : (["hour", "hr", "hrs", "hours"].includes(unit) ? "HRS:MIN:SEC" : "MIN:SEC")}
                    </Text>
                    {isDistance && <Text style={[styles.subTimer, { color: colors.textMuted }]}>{formatTime(seconds)}</Text>}
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
                        {isDistance ? "Location tracking active." : "Session started."} You can close the app.
                    </Text>
                )}
            </View>
        );
    }
    return null;
};

const styles = StyleSheet.create({
    mainBtn: { backgroundColor: "#2f6f3f", borderRadius: 16, paddingVertical: 16, alignItems: "center", width: "100%", elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
    numericContainer: { alignItems: 'center', gap: 16, width: '100%', marginTop: 8 },
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
    activeHint: { fontSize: 12, color: '#2f6f3f', fontWeight: '600' }
});

HabitActionSection.displayName = "HabitActionSection";

export default HabitActionSection;
