import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faFire, faTrophy, faClock } from "@fortawesome/free-solid-svg-icons";
import CircularProgress from "./CircularProgress";
import { useTheme } from "../../../context/ThemeContext";
import { useTranslation } from "react-i18next";



// ── Design tokens ─────────────────────────────────────────────
const STROKE      = 11;          // unified circle stroke
const BAR_H       = 48;
const BAR_W       = 12;

// ── State enum ────────────────────────────────────────────────
// completed            → filled green
// today + completed    → filled green + glow border
// today + not done     → empty + green border (outline only)
// future / not done    → gray, lower opacity

// ── Animated mini bar ─────────────────────────────────────────
const AnimatedBar = ({ d, isPast, colors, isDark }) => {
    const fillAnim  = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const { t } = useTranslation();

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
    const fillColor = isDone ? colors.primary : "transparent";

    // Track background — always gray
    const trackBg = colors.cardSecondary;

    return (
        <View style={styles.barWrapper}>
            <Animated.View style={[
                ...trackStyle,
                isTodayComplete && { borderColor: colors.primary, shadowColor: colors.primary },
                isTodayIncomplete && { borderColor: colors.primary },
                { transform: isTodayIncomplete ? [{ scaleY: pulseAnim }] : [], backgroundColor: trackBg },
            ]}>
                <Animated.View style={[
                    styles.barFill,
                    { height: barH, backgroundColor: fillColor },
                ]} />
            </Animated.View>

            <Text style={[
                styles.dayLabel,
                { color: colors.textSecondary },
                d.isToday && [styles.dayLabelToday, { color: colors.primary }],
                isFuture  && !d.isToday && styles.dayLabelFuture,
            ]}>
                {t(`habit_details.days_short.${["mon", "tue", "wed", "thu", "fri", "sat", "sun"][d._index ?? 0]}`)}
            </Text>
        </View>
    );
};

const WeeklyChart = ({ data, colors, isDark }) => {
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
                    colors={colors}
                    isDark={isDark}
                />
            ))}
        </View>
    );
};

const HabitProgressCard = ({
    habit,
    weeklyData,
    liveDelta   = 0,
    title       = null,
    weeklyStats = null,
}) => {
    const { theme, isDark } = useTheme();
    const { colors } = theme;
    const { t } = useTranslation();

    if (!habit) return <View />;

    const isWeekly = weeklyStats != null;

    const totalCurrent   = (habit.currentValue ?? 0) + liveDelta;
    const dailyPercent   = Math.min(100, (totalCurrent / (habit.targetValue ?? 1)) * 100);
    const displayPercent = isWeekly
        ? Math.round(weeklyStats.completionPercentage ?? 0)
        : Math.round(dailyPercent);

    const formatValue = (val) => {
        if (Number.isInteger(val)) return val.toString();
        const withDec = ["km", "m", "hour", "hr", "hrs", "min", "minutes"];
        return val.toFixed(withDec.includes(habit.unit?.toLowerCase()) ? 2 : 1);
    };

    return (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
            {title && <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>{title}</Text>}

            <View style={styles.row}>
                <CircularProgress
                    percent={displayPercent}
                    size={120}
                    strokeWidth={STROKE}
                    color={colors.primary}
                    textColor={colors.text}
                    trackColor={colors.border}
                />

                <View style={styles.statsCol}>
                    {isWeekly ? (
                        <View>
                            <Text style={[styles.primaryText, { color: colors.text }]}>
                                {t("habit_details.completed_count", { 
                                    completed: weeklyStats.completedDays, 
                                    total: weeklyStats.totalDays,
                                    unit: t("habit_details.days")
                                })}
                            </Text>
                            <Text style={[styles.primarySub, { color: colors.textSecondary }]}>
                                {t("habit_details.completed_this_week")}
                            </Text>
                        </View>
                    ) : (
                        <Text style={[styles.primaryText, { color: colors.text }]}>
                            {formatValue(totalCurrent)} / {habit.targetValue}
                            <Text style={[styles.primarySub, { color: colors.textSecondary }]}> {t(`units.${habit.unit?.toLowerCase()}`, { defaultValue: habit.unit })}</Text>
                        </Text>
                    )}

                    <View style={styles.metaGroup}>
                        <View style={styles.metaRow}>
                            <FontAwesomeIcon icon={faFire}   color="#f59e0b" size={13} />
                            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
                                {t("habit_details.streak")}:{" "}
                                <Text style={[styles.metaValue, { color: colors.text }]}>
                                    {habit.currentStreak ?? 0}{" "}
                                    {t("habit_details.days")}
                                </Text>
                            </Text>
                        </View>
                        <View style={styles.metaRow}>
                            <FontAwesomeIcon icon={faTrophy} color="#f59e0b" size={13} />
                            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
                                {t("habit_details.best")}:{" "}
                                <Text style={[styles.metaValue, { color: colors.text }]}>
                                    {habit.longestStreak ?? 0}{" "}
                                    {t("habit_details.days")}
                                </Text>
                            </Text>
                        </View>
                        {habit.todayActualDuration > 0 && (
                            <View style={styles.metaRow}>
                                <FontAwesomeIcon icon={faClock} color={colors.primary} size={13} />
                                <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
                                    {t("habit_details.time")}:{" "}
                                    <Text style={[styles.metaValue, { color: colors.text }]}>
                                        {habit.todayActualDuration} {t("habit_details.min_spent")}
                                    </Text>
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>

            {isWeekly && <WeeklyChart data={weeklyData} colors={colors} isDark={isDark} />}
        </View>
    );
};

HabitProgressCard.displayName = "HabitProgressCard";

const styles = StyleSheet.create({
    card: {
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
        textTransform: "uppercase",
        letterSpacing: 1.2,
        marginBottom: 16,
    },

    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 20,
    },
    statsCol: {
        flex: 1,
        justifyContent: "center",
    },

    primaryText: {
        fontSize: 19,
        fontWeight: "800",
        lineHeight: 26,
    },
    primarySub: {
        fontSize: 13,
        fontWeight: "500",
    },
    contextLabel: {
        fontSize: 12,
        fontWeight: "500",
    },

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
    },
    metaValue: {
        fontWeight: "700",
    },

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
        justifyContent: "flex-end",
        overflow: "hidden",
    },

    // Today + completed → green glow border
    trackTodayDone: {
        borderWidth: 1.5,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 5,
        elevation: 4,
    },
    // Today + pending → outline only, no fill
    trackTodayPending: {
        borderWidth: 1.5,
    },
    // Past not done + future → slightly faded
    trackFuture: {
        opacity: 0.65,
    },

    barFill: {
        width: "100%",
        borderRadius: 6,
    },

    dayLabel: {
        fontSize: 9,
        fontWeight: "600",
        marginTop: 5,
        letterSpacing: 0.4,
    },
    dayLabelToday: {
        fontWeight: "800",
    },
    dayLabelFuture: {
        opacity: 0.55,
    },
});

export default HabitProgressCard;
