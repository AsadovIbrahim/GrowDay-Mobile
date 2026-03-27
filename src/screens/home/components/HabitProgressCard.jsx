import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faFire, faTrophy } from "@fortawesome/free-solid-svg-icons";
import CircularProgress from "./CircularProgress";

// ── Design tokens ─────────────────────────────────────────────
const GREEN       = "#2f6f3f";
const GREEN_MID   = "#10b981";
const GREEN_GLOW  = "rgba(47,111,63,0.18)";
const GRAY_BAR    = "#e8eaed";
const GRAY_TEXT   = "#6b7280";
const DARK_TEXT   = "#111827";
const STROKE      = 11;          // unified circle stroke
const BAR_H       = 48;
const BAR_W       = 12;

// ── State enum ────────────────────────────────────────────────
// completed            → filled green
// today + completed    → filled green + glow border
// today + not done     → empty + green border (outline only)
// future / not done    → gray, lower opacity

// ── Animated mini bar ─────────────────────────────────────────
const AnimatedBar = ({ d, isPast }) => {
    const fillAnim  = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    const isDone            = d.value >= 100;
    const isTodayComplete   = d.isToday && isDone;
    const isTodayIncomplete = d.isToday && !isDone;
    const isFuture          = !d.isToday && !isDone && !isPast;

    // Target fill ratio
    const targetFill = isDone ? 1 : 0;

    useEffect(() => {
        Animated.spring(fillAnim, {
            toValue: targetFill,
            useNativeDriver: false,
            tension: 60,
            friction: 8,
            delay: (d._index ?? 0) * 45,
        }).start();
    }, [d.value]);

    // Pulse only for today-incomplete bar
    useEffect(() => {
        if (!isTodayIncomplete) return;
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.10, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1.00, duration: 800, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [isTodayIncomplete]);

    const barH = fillAnim.interpolate({
        inputRange:  [0, 1],
        outputRange: [4, BAR_H],
    });

    // Track style
    const trackStyle = [
        styles.barTrack,
        isTodayComplete   && styles.trackTodayDone,
        isTodayIncomplete && styles.trackTodayPending,
        isFuture          && styles.trackFuture,
    ];

    // Fill color: completed → green, else transparent
    const fillColor = isDone ? GREEN_MID : "transparent";

    // Track background — always gray
    const trackBg = GRAY_BAR;

    return (
        <View style={styles.barWrapper}>
            <Animated.View style={[
                ...trackStyle,
                { transform: isTodayIncomplete ? [{ scaleY: pulseAnim }] : [], backgroundColor: trackBg },
            ]}>
                <Animated.View style={[
                    styles.barFill,
                    { height: barH, backgroundColor: fillColor },
                ]} />
            </Animated.View>

            <Text style={[
                styles.dayLabel,
                d.isToday && styles.dayLabelToday,
                isFuture  && !d.isToday && styles.dayLabelFuture,
            ]}>
                {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"][d._index ?? 0]}
            </Text>
        </View>
    );
};

// ── Weekly bar chart ──────────────────────────────────────────
const WeeklyChart = ({ data }) => {
    if (!data || data.length === 0) return null;
    // Find today's index to distinguish past vs future
    const todayIdx = data.findIndex(d => d.isToday);
    return (
        <View style={styles.chartRow}>
            {data.map((d, i) => (
                <AnimatedBar
                    key={i}
                    d={{ ...d, _index: i }}
                    isPast={todayIdx >= 0 ? i < todayIdx : false}
                />
            ))}
        </View>
    );
};

// ── Main card ─────────────────────────────────────────────────
const HabitProgressCard = ({
    habit,
    weeklyData,
    liveDelta   = 0,
    title       = null,
    weeklyStats = null,
}) => {
    if (!habit) return <View />;

    const isWeekly = weeklyStats != null;

    const totalCurrent   = (habit.currentValue ?? 0) + liveDelta;
    const dailyPercent   = Math.min(100, (totalCurrent / (habit.targetValue ?? 1)) * 100);
    const displayPercent = isWeekly
        ? Math.round(weeklyStats.completionPercentage ?? 0)
        : Math.round(dailyPercent);

    const formatValue = (val) => {
        if (Number.isInteger(val)) return val.toString();
        const withDec = ["km", "m", "hour", "hr", "hrs"];
        return val.toFixed(withDec.includes(habit.unit?.toLowerCase()) ? 2 : 1);
    };

    return (
        <View style={styles.card}>
            {/* Title */}
            {title && <Text style={styles.cardTitle}>{title}</Text>}

            {/* Circle + Stats */}
            <View style={styles.row}>
                <CircularProgress
                    percent={displayPercent}
                    size={120}
                    strokeWidth={STROKE}
                    color={GREEN}
                />

                <View style={styles.statsCol}>
                    {/* Primary value */}
                    {isWeekly ? (
                        <Text style={styles.primaryText}>
                            {weeklyStats.completedDays}
                            <Text style={styles.primarySub}>
                                {" "}of {weeklyStats.totalDays} days completed{" "}
                            </Text>
                            <Text style={styles.contextLabel}>this week</Text>
                        </Text>
                    ) : (
                        <Text style={styles.primaryText}>
                            {formatValue(totalCurrent)} / {habit.targetValue}
                            <Text style={styles.primarySub}> {habit.unit}</Text>
                        </Text>
                    )}

                    {/* Streak + Best */}
                    <View style={styles.metaGroup}>
                        <View style={styles.metaRow}>
                            <FontAwesomeIcon icon={faFire}   color="#f59e0b" size={13} />
                            <Text style={styles.metaLabel}>
                                Streak:{" "}
                                <Text style={styles.metaValue}>
                                    {habit.currentStreak ?? 0}{" "}
                                    {habit.currentStreak === 1 ? "day" : "days"}
                                </Text>
                            </Text>
                        </View>
                        <View style={styles.metaRow}>
                            <FontAwesomeIcon icon={faTrophy} color="#f59e0b" size={13} />
                            <Text style={styles.metaLabel}>
                                Best:{" "}
                                <Text style={styles.metaValue}>
                                    {habit.longestStreak ?? 0}{" "}
                                    {habit.longestStreak === 1 ? "day" : "days"}
                                </Text>
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Mini bars — only in Weekly card */}
            {isWeekly && <WeeklyChart data={weeklyData} />}
        </View>
    );
};

HabitProgressCard.displayName = "HabitProgressCard";

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
    card: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 4,
    },
    cardTitle: {
        fontSize: 13,
        fontWeight: "800",
        color: GRAY_TEXT,
        textTransform: "uppercase",
        letterSpacing: 1.2,
        marginBottom: 16,
    },

    /* ── Row ── */
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 20,
    },
    statsCol: {
        flex: 1,
        justifyContent: "center",
    },

    /* ── Text ── */
    primaryText: {
        fontSize: 19,
        fontWeight: "800",
        color: DARK_TEXT,
        lineHeight: 26,
    },
    primarySub: {
        fontSize: 13,
        fontWeight: "500",
        color: GRAY_TEXT,
    },
    contextLabel: {
        fontSize: 12,
        fontWeight: "500",
        color: GREEN,
    },

    /* ── Meta ── */
    metaGroup: {
        marginTop: 10,
        gap: 5,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    metaLabel: {
        fontSize: 13,
        color: GRAY_TEXT,
    },
    metaValue: {
        color: DARK_TEXT,
        fontWeight: "700",
    },

    /* ── Chart ── */
    chartRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        marginTop: 22,
        gap: 4,               // +breathing space between bars
    },
    barWrapper: {
        alignItems: "center",
        flex: 1,
    },
    barTrack: {
        width: BAR_W,
        height: BAR_H,
        borderRadius: 6,
        backgroundColor: GRAY_BAR,
        justifyContent: "flex-end",
        overflow: "hidden",
    },

    // Today + completed → green glow border
    trackTodayDone: {
        borderWidth: 1.5,
        borderColor: GREEN,
        shadowColor: GREEN_GLOW,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 5,
        elevation: 4,
    },
    // Today + pending → outline only, no fill
    trackTodayPending: {
        borderWidth: 1.5,
        borderColor: GREEN,
        backgroundColor: "transparent",
    },
    // Past not done + future → slightly faded
    trackFuture: {
        opacity: 0.65,
    },

    barFill: {
        width: "100%",
        borderRadius: 6,
    },

    /* ── Day labels ── */
    dayLabel: {
        fontSize: 9,
        color: "#b0b8c4",
        fontWeight: "600",
        marginTop: 5,
        letterSpacing: 0.4,
    },
    dayLabelToday: {
        color: GREEN,
        fontWeight: "800",
    },
    dayLabelFuture: {
        opacity: 0.55,
    },
});

export default HabitProgressCard;
