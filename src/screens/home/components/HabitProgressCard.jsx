import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faFire, faTrophy, faClock } from "@fortawesome/free-solid-svg-icons";
import CircularProgress from "./CircularProgress";
import { useTheme } from "../../../context/ThemeContext";
import { useTranslation } from "react-i18next";



// ── Design tokens ─────────────────────────────────────────────
const STROKE = 8;          // unified circle stroke
const BAR_H = 32;
const BAR_W = 8;

// ── State enum ────────────────────────────────────────────────
// completed            → filled green
// today + completed    → filled green + glow border
// today + not done     → empty + green border (outline only)
// future / not done    → gray, lower opacity

// ── Animated mini bar ─────────────────────────────────────────
const AnimatedBar = ({ d, isPast, colors, isDark }) => {
    const fillAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const { t } = useTranslation();

    const isDone = d.value >= 100;
    const isTodayComplete = d.isToday && isDone;
    const isTodayIncomplete = d.isToday && !isDone;
    const isFuture = !d.isToday && !isDone && !isPast;

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
        inputRange: [0, 1],
        outputRange: [4, BAR_H],
    });

    // Track style
    const trackStyle = [
        styles.barTrack,
        isTodayComplete && styles.trackTodayDone,
        isTodayIncomplete && styles.trackTodayPending,
        isFuture && styles.trackFuture,
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

            <Text
                className={d.isToday ? "font-redditsans-bold text-[10px] mt-1 tracking-wider" : "font-redditsans-semibold text-[10px] mt-1 tracking-wider"}
                style={[
                    { color: colors.textSecondary },
                    d.isToday && { color: colors.primary },
                    isFuture && !d.isToday && styles.dayLabelFuture,
                ]}
            >
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
    liveDelta = 0,
    title = null,
    weeklyStats = null,
    layout = null,
}) => {
    const { theme, isDark } = useTheme();
    const { colors } = theme;
    const { t } = useTranslation();

    if (layout === "chart") {
        return (
            <View style={[styles.card, { backgroundColor: colors.card }]}>
                <WeeklyChart data={weeklyData} colors={colors} isDark={isDark} />
            </View>
        );
    }

    if (!habit) return <View />;

    const isWeekly = weeklyStats != null;

    const totalCurrent = (habit.currentValue ?? 0) + liveDelta;
    const dailyPercent = Math.min(100, (totalCurrent / (habit.targetValue ?? 1)) * 100);
    const displayPercent = isWeekly
        ? Math.round(weeklyStats.completionPercentage ?? 0)
        : Math.round(dailyPercent);

    const formatValue = (val) => {
        if (Number.isInteger(val)) return val.toString();
        const withDec = ["km", "m", "hour", "hr", "hrs", "min", "minutes"];
        return val.toFixed(withDec.includes(habit.unit?.toLowerCase()) ? 2 : 1);
    };

    if (layout === "today" || layout === "weekly") {
        const isWeeklyLayout = layout === "weekly";
        return (
            <View style={[styles.cardSideBySide, { backgroundColor: colors.card }]}>
                {title && (
                    <Text
                        className="font-redditsans-bold text-[10px] uppercase tracking-[1px] mb-2 text-center"
                        style={{ color: colors.textSecondary }}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                    >
                        {title}
                    </Text>
                )}

                <View style={styles.colCentered}>
                    <CircularProgress
                        percent={displayPercent}
                        size={64}
                        strokeWidth={6}
                        color={colors.primary}
                        textColor={colors.text}
                        trackColor={colors.border}
                    />

                    {isWeeklyLayout ? (
                        <Text
                            className='font-redditsans-bold text-[12px] text-center mt-2'
                            style={{ color: colors.text }}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                        >
                            {t("habit_details.completed_count", {
                                completed: weeklyStats?.completedDays ?? 0,
                                total: weeklyStats?.totalDays ?? 7,
                                unit: t("habit_details.days")
                            })}
                        </Text>
                    ) : (
                        <Text
                            className='font-redditsans-bold text-[12px] text-center mt-2'
                            style={{ color: colors.text }}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                        >
                            {formatValue(totalCurrent)}/{habit.targetValue}
                            <Text className='font-redditsans-semibold text-[10px]' style={{ color: colors.textSecondary }}> {t(`units.${habit.unit?.toLowerCase()}`, { defaultValue: habit.unit })}</Text>
                        </Text>
                    )}
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
            {title && <Text className="font-redditsans-bold text-xs uppercase tracking-[1.2px] mb-2" style={{ color: colors.textSecondary }}>{title}</Text>}

            <View style={styles.row}>
                <CircularProgress
                    percent={displayPercent}
                    size={80}
                    strokeWidth={STROKE}
                    color={colors.primary}
                    textColor={colors.text}
                    trackColor={colors.border}
                />

                <View style={styles.statsCol}>
                    {isWeekly ? (
                        <View style={styles.weeklySummary}>
                            <Text
                                className='font-redditsans-bold'
                                style={[styles.weeklyPrimary, { color: colors.text }]}
                                numberOfLines={2}
                                adjustsFontSizeToFit
                                minimumFontScale={0.8}
                            >
                                {t("habit_details.completed_count", {
                                    completed: weeklyStats.completedDays,
                                    total: weeklyStats.totalDays,
                                    unit: t("habit_details.days")
                                })}
                            </Text>
                            <Text
                                className='font-redditsans-semibold'
                                style={[styles.weeklySecondary, { color: colors.textSecondary }]}
                                numberOfLines={1}
                            >
                                {t("habit_details.completed_this_week")}
                            </Text>
                        </View>
                    ) : (
                        <Text className='font-redditsans-bold text-lg' style={{ color: colors.text }} numberOfLines={2}>
                            {formatValue(totalCurrent)} / {habit.targetValue}
                            <Text className='font-redditsans-semibold text-xs' style={{ color: colors.textSecondary }}> {t(`units.${habit.unit?.toLowerCase()}`, { defaultValue: habit.unit })}</Text>
                        </Text>
                    )}

                    <View style={styles.metaGroup}>
                        <View style={styles.metaRow}>
                            <FontAwesomeIcon icon={faFire} color="#f59e0b" size={11} />
                            <Text className='font-redditsans-semibold text-[11px]' style={{ color: colors.textSecondary }}>
                                {t("habit_details.streak")}:{" "}
                                <Text className='font-redditsans-bold text-[11px]' style={{ color: colors.text }}>
                                    {habit.currentStreak ?? 0}{" "}
                                    {t("habit_details.days")}
                                </Text>
                            </Text>
                        </View>
                        <View style={styles.metaRow}>
                            <FontAwesomeIcon icon={faTrophy} color="#f59e0b" size={11} />
                            <Text className='font-redditsans-semibold text-[11px]' style={{ color: colors.textSecondary }}>
                                {t("habit_details.best")}:{" "}
                                <Text className='font-redditsans-bold text-[11px]' style={{ color: colors.text }}>
                                    {habit.longestStreak ?? 0}{" "}
                                    {t("habit_details.days")}
                                </Text>
                            </Text>
                        </View>
                        {habit.todayActualDuration > 0 && (
                            <View style={styles.metaRow}>
                                <FontAwesomeIcon icon={faClock} color={colors.primary} size={11} />
                                <Text className='font-redditsans-semibold text-[11px]' style={{ color: colors.textSecondary }}>
                                    {t("habit_details.time")}:{" "}
                                    <Text className='font-redditsans-bold text-[11px]' style={{ color: colors.text }}>
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
    cardSideBySide: {
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 10,
        marginBottom: 12,
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 4,
    },
    colCentered: {
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
    },
    card: {
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 4,
    },
    cardTitle: {
        fontSize: 11,
        fontWeight: "800",
        textTransform: "uppercase",
        letterSpacing: 1.2,
        marginBottom: 8,
    },

    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
    },
    statsCol: {
        flex: 1,
        minWidth: 0,
        justifyContent: "center",
    },
    weeklySummary: {
        gap: 2,
    },
    weeklyPrimary: {
        fontSize: 16,
        lineHeight: 22,
    },
    weeklySecondary: {
        fontSize: 12,
    },

    primaryText: {
        fontSize: 16,
        fontWeight: "800",
        lineHeight: 22,
    },
    primarySub: {
        fontSize: 12,
        fontWeight: "500",
    },
    contextLabel: {
        fontSize: 11,
        fontWeight: "500",
    },

    metaGroup: {
        marginTop: 6,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    metaLabel: {
        fontSize: 11,
    },
    metaValue: {
        fontWeight: "700",
    },

    chartRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        marginTop: 14,
        gap: 2,
    },
    barWrapper: {
        alignItems: "center",
        flex: 1,
    },
    barTrack: {
        width: BAR_W,
        height: BAR_H,
        borderRadius: 4,
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
        borderRadius: 4,
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
