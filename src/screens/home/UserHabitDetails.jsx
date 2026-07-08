import { View, Text, Pressable, ScrollView, TextInput, StyleSheet, Alert, Modal, KeyboardAvoidingView, Platform, Animated, Easing } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowLeft, faEdit, faNoteSticky, faExclamationTriangle, faHistory, faCheck, faFire, faTrophy } from "@fortawesome/free-solid-svg-icons";
import { getUserHabitByIdFetch, getWeeklyProgressFetch, reportHabitProgressFetch } from "../../utils/fetch";

import { useMMKVString } from "react-native-mmkv";
import { storage } from "../../utils/MMKVStore";
import { useEffect, useState, useRef } from "react";
import { ICONS } from "../../constants/icons";
import { TouchableOpacity } from "react-native";
import HabitProgressCard from "./components/HabitProgressCard";
import HabitActionSection from "./components/HabitActionSection";
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from "react-i18next";
import { getTranslatedHabit } from "../../utils/habitTranslations";


const CATEGORY_ICON_MAP = {
    default: '⭐', health: '❤️', fitness: '💪', mindfulness: '🧘',
    productivity: '📈', learning: '📚', social: '👥', finance: '💰',
    nutrition: '🍎', sleep: '😴', creativity: '🎨', selfcare: '💅',
    hydration: '💧', work: '💼', music: '🎵', sports: '⚽',
    nature: '🌱', meditation: '🕊️', coding: '💻', travel: '✈️',
};

const getCategoryIcon = (iconKey) => {
    if (!iconKey) return '⭐';
    if ([...iconKey].length <= 2 && iconKey.codePointAt(0) > 255) return iconKey;
    return CATEGORY_ICON_MAP[iconKey.toLowerCase()] || '⭐';
};

const weeklyDataPlaceholder = [
    { value: 0, active: false },
    { value: 0, active: false },
    { value: 0, active: false },
    { value: 0, active: false },
    { value: 0.1, active: false, isToday: true },
    { value: 0, active: false },
    { value: 0, active: false },
];

const UserHabitDetails = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const [userHabit, setUserHabit] = useState(null);
    const { t, i18n } = useTranslation();
    const [weeklyProgress, setWeeklyProgress] = useState(null);
    const [weeklyStats, setWeeklyStats] = useState(null);
    const [note, setNote] = useState("");
    const [liveDelta, setLiveDelta] = useState(0);
    const noteInputRef = useRef(null);
    const [token] = useMMKVString("accessToken");
    const [isFocused, setIsFocused] = useState(false);
    const { theme } = useTheme();
    const { colors } = theme;
    const progressAnim = useRef(new Animated.Value(0)).current;
    const isFutureDate = route.params?.isFuture || (() => {
        const dateParam = route.params?.date;
        if (!dateParam) return false;

        // Use local date strings for comparison to avoid timezone issues
        const today = new Date();
        const todayStr = today.getFullYear() + '-' +
            String(today.getMonth() + 1).padStart(2, '0') + '-' +
            String(today.getDate()).padStart(2, '0');

        const targetStr = dateParam.includes('T') ? dateParam.split('T')[0] : dateParam;

        return targetStr > todayStr;
    })();

    const isLockedPastDate = (() => {
        const dateParam = route.params?.date;
        if (!dateParam) return false;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const targetDate = new Date(dateParam.includes('T') ? dateParam.split('T')[0] : dateParam);
        targetDate.setHours(0, 0, 0, 0);

        return targetDate < yesterday;
    })();

    const targetDateObj = route.params?.date ? new Date(route.params.date) : new Date();
    const isAlreadyDone = userHabit?.lastCompletedDate &&
        new Date(userHabit.lastCompletedDate).toDateString() === targetDateObj.toDateString();

    const isProgressCompleted = userHabit && (userHabit.progressPercentage >= 100);

    const isFullyCompleted = isAlreadyDone || isProgressCompleted;

    useEffect(() => {
        const habitId = route.params?.habitId;
        const date = route.params?.date;
        if (habitId) {
            setLiveDelta(0); // Clear any leftovers from previous habit views
            getUserHabitById(habitId, date);
            getWeeklyProgress(habitId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [route.params?.habitId, route.params?.date]);

    const totalCurrent = userHabit ? ((userHabit.currentValue ?? 0) + liveDelta) : 0;
    const dailyPercent = userHabit ? Math.min(100, (totalCurrent / (userHabit.targetValue ?? 1)) * 100) : 0;

    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: dailyPercent,
            duration: 800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }).start();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dailyPercent]);


    const getUserHabitById = async (habitId, date = null) => {
        try {
            if (!token) return;
            const response = await getUserHabitByIdFetch(token, habitId, date);
            if (response?.data) {
                const newData = response.data;

                // Check for background celebration flag
                const dateStr = date ? date.split('T')[0] : new Date().toISOString().split('T')[0];
                const celebrateKey = `celebrate_${habitId}_${dateStr}`;
                const hasCelebrateFlag = storage.getString(celebrateKey) === 'true';

                if (hasCelebrateFlag) {
                    storage.delete(celebrateKey);
                    storage.delete(`timer_start_${habitId}_${dateStr}`);
                    storage.delete(`timer_acc_${habitId}_${dateStr}`);
                    storage.delete(`timer_target_${habitId}_${dateStr}`);
                    storage.delete(`timer_unit_${habitId}_${dateStr}`);
                    storage.delete(`pending_stop_${habitId}_${dateStr}`);

                    try {
                        const { NativeModules } = require('react-native');
                        if (NativeModules.RNSound && typeof NativeModules.RNSound.stopAllPlayers === 'function') {
                            NativeModules.RNSound.stopAllPlayers();
                        }
                    } catch (e) { }

                    const updatedHabit = { ...newData, currentValue: newData.targetValue || 1 };
                    navigation.navigate("HabitCelebration", { habit: updatedHabit });
                    return;
                }

                // Calculate how much the server has actually advanced since our last baseline
                const confirmedAmount = Math.max(0, (newData.currentValue ?? 0) - (userHabit?.currentValue ?? 0));

                // Subtract that confirmed amount from our "live" (unconfirmed) delta
                setLiveDelta(prev => Math.max(0, prev - confirmedAmount));

                setUserHabit(newData);
                setNote(newData.note || "");
            }



        } catch (e) {
            // Error handled
        }
    };

    const getWeeklyProgress = async (habitId) => {
        try {
            if (!token) return;
            const response = await getWeeklyProgressFetch(token, habitId);
            // API returns WeeklyHabitProgressResponseDTO: { weeklyProgress: [...], totalDays, completedDays, completionPercentage }
            const dto = response?.data;
            const raw = dto?.weeklyProgress ?? dto;
            if (Array.isArray(raw)) {
                const mapped = raw.map(d => ({
                    ...d,
                    value: d.isCompleted ? 100 : 0,
                }));
                setWeeklyProgress(mapped);
                // Store summary stats separately
                if (dto?.totalDays !== undefined) {
                    setWeeklyStats({
                        totalDays: dto.totalDays,
                        completedDays: dto.completedDays,
                        completionPercentage: dto.completionPercentage,
                    });
                }
            }
        } catch (e) {
            // Error handled
        }
    };

    const handleSaveNote = async () => {
        try {
            const hId = userHabit?.userHabitId || userHabit?.UserHabitId || userHabit?.id;
            if (!hId || !token) return;

            const payload = {
                userHabitId: hId,
                deltaValue: 0,
                source: 'manual',
                note: note,
                timestamp: new Date().toISOString(),
                date: route.params?.date
            };

            const result = await reportHabitProgressFetch(token, payload);
            if (result.success) {
                Alert.alert(t("common.success"), t("habit_details.note_saved"));
                getUserHabitById(route.params.habitId, route.params?.date);
            }
        } catch (error) {
            console.error("Save note error:", error);
            Alert.alert(t("common.error"), t("common.failed_load"));
        }
    };



    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <LinearGradient colors={colors.backgroundGradient} style={{ flex: 1 }}>

                <View style={styles.header}>
                    <Pressable onPress={() => navigation.goBack()} style={[styles.iconCircle, { backgroundColor: colors.card }]} hitSlop={10}>
                        <FontAwesomeIcon icon={faArrowLeft} color={colors.text} size={18} />
                    </Pressable>
                    <View style={{ flex: 1, marginLeft: 16 }}>
                        <Text className="font-redditsans-bold" style={[styles.headerTitle, { color: colors.text }]}>{t("habit_details.header")}</Text>
                        <Text className="font-redditsans-medium" style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{t("habit_details.sub_header")}</Text>
                    </View>
                    <View style={styles.headerActions}>
                        {!isFutureDate && (
                            <>
                                <Pressable
                                    onPress={() => navigation.navigate("HabitHistory", {
                                        habitId: userHabit?.userHabitId,
                                        habitTitle: userHabit?.title,
                                        habitIcon: userHabit?.icon
                                    })}
                                    style={[styles.iconCircle, { backgroundColor: colors.card }]}
                                    hitSlop={10}
                                >
                                    <FontAwesomeIcon icon={faHistory} color={colors.primary} size={16} />
                                </Pressable>
                                <Pressable
                                    onPress={() => navigation.navigate("CreateCustomHabit", {
                                        habitData: userHabit,
                                        isEditMode: true,
                                        isCustom: !userHabit?.habitId && !userHabit?.suggestedHabitId
                                    })}
                                    style={[styles.iconCircle, { backgroundColor: colors.card }]}
                                    hitSlop={10}
                                >
                                    <FontAwesomeIcon icon={faEdit} color={colors.textSecondary} size={16} />
                                </Pressable>
                            </>
                        )}
                    </View>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    <View style={styles.titleSection}>
                        <Text
                            className="font-redditsans-bold"
                            style={[styles.habitTitle, { color: colors.text }]}
                        >
                            {userHabit?.title || "Loading..."} {ICONS[userHabit?.icon]}
                        </Text>
                        <Text
                            className="font-redditsans-medium"
                            style={[styles.habitDesc, { color: colors.textSecondary }]}
                        >
                            {userHabit?.description ||
                                getTranslatedHabit(userHabit, i18n.language, t).description}
                        </Text>

                        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                            {userHabit?.categoryDetails && (
                                <View
                                    style={[
                                        styles.tag,
                                        {
                                            backgroundColor: (userHabit.categoryDetails.color || colors.primary) + '20',
                                            marginTop: 0,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 4
                                        }
                                    ]}
                                >
                                    <Text
                                        className="font-redditsans-bold"
                                        style={[
                                            styles.tagText,
                                            {
                                                color: userHabit.categoryDetails.color || colors.primary,
                                                fontWeight: '700'
                                            }
                                        ]}
                                    >
                                        {userHabit.categoryDetails.name}
                                    </Text>
                                </View>
                            )}
                            <View style={[styles.tag, { backgroundColor: colors.cardSecondary, marginTop: 0 }]}>
                                <Text className="font-redditsans-bold" style={[styles.tagText, { color: colors.textSecondary }]}>
                                    {t(`my_habits.filters.${(userHabit?.frequency ?? "Daily").toLowerCase()}`, { defaultValue: userHabit?.frequency ?? "Daily" })}
                                </Text>
                            </View>
                            {userHabit?.currentStreak !== undefined && (
                                <View style={[styles.tag, { backgroundColor: colors.cardSecondary, marginTop: 0, flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                                    <FontAwesomeIcon icon={faFire} color="#f59e0b" size={12} />
                                    <Text className="font-redditsans-bold" style={[styles.tagText, { color: colors.textSecondary }]}>
                                        {userHabit.currentStreak} {t("habit_details.days")}
                                    </Text>
                                </View>
                            )}
                            {userHabit?.longestStreak !== undefined && (
                                <View style={[styles.tag, { backgroundColor: colors.cardSecondary, marginTop: 0, flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                                    <FontAwesomeIcon icon={faTrophy} color="#f59e0b" size={11} />
                                    <Text className="font-redditsans-bold" style={[styles.tagText, { color: colors.textSecondary }]}>
                                        {userHabit.longestStreak} {t("habit_details.days")}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Bugünkü Tərəqqi / Today's Progress Horizontal Bar */}
                        {userHabit && (
                            <View style={{ marginTop: 20 }}>
                                <Text className="font-redditsans-bold text-[12px] uppercase tracking-[0.8px] mb-2" style={{ color: colors.textSecondary }}>
                                    {t("habit_details.todays_performance")}
                                </Text>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <Text className="font-redditsans-bold text-[16px]" style={{ color: colors.text }}>
                                        {(() => {
                                            const formatValue = (val) => {
                                                if (Number.isInteger(val)) return val.toString();
                                                const withDec = ["km", "m", "hour", "hr", "hrs", "min", "minutes"];
                                                return val.toFixed(withDec.includes(userHabit.unit?.toLowerCase()) ? 2 : 1);
                                            };
                                            return `${formatValue(totalCurrent)} / ${userHabit.targetValue}`;
                                        })()}
                                        <Text className="font-redditsans-semibold text-[13px]" style={{ color: colors.textSecondary }}>
                                            {" "}{t(`units.${userHabit.unit?.toLowerCase()}`, { defaultValue: userHabit.unit })}
                                        </Text>
                                    </Text>
                                    <Text className="font-redditsans-bold text-[16px]" style={{ color: colors.primary }}>
                                        {Math.round(dailyPercent)}%
                                    </Text>
                                </View>
                                <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden', width: '100%' }}>
                                    <Animated.View
                                        style={{
                                            height: '100%',
                                            backgroundColor: colors.primary,
                                            borderRadius: 3,
                                            width: progressAnim.interpolate({
                                                inputRange: [0, 100],
                                                outputRange: ['0%', '100%']
                                            })
                                        }}
                                    />
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Separator Line */}
                    <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 14 }} />

                    {isFutureDate ? (
                        <View style={[styles.futureNotice, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}>
                            <Text className="font-redditsans-medium" style={[styles.futureNoticeText, { color: colors.textSecondary }]}>
                                {t("home.upcoming_habits")}
                            </Text>
                        </View>
                    ) : isLockedPastDate && !isFullyCompleted ? (
                        <View style={[styles.futureNotice, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}>
                            <Text style={{ fontSize: 24, marginBottom: 8, textAlign: 'center' }}>🔒</Text>
                            <Text className="font-redditsans-bold" style={[{ fontSize: 16, textAlign: 'center', marginBottom: 4, color: colors.text }]}>
                                {t("habit_details.locked_past_title", { defaultValue: "Time Expired" })}
                            </Text>
                            <Text className="font-redditsans-medium" style={[styles.futureNoticeText, { color: colors.textSecondary }]}>
                                {t("habit_details.locked_past_desc", { defaultValue: "You can only log progress for today and yesterday." })}
                            </Text>
                        </View>
                    ) : userHabit && !isFullyCompleted && (
                        <HabitActionSection
                            habit={userHabit}
                            token={token}
                            note={note}
                            date={route.params?.date}
                            isFuture={isFutureDate}
                            onActionComplete={() => {
                                if (route.params?.habitId) {
                                    getUserHabitById(route.params.habitId, route.params?.date);
                                    getWeeklyProgress(route.params.habitId);
                                }
                            }}
                            onLiveUpdate={setLiveDelta}
                        />
                    )}

                    {!isFutureDate && !isLockedPastDate && (
                        <Pressable
                            onPress={() => noteInputRef.current?.focus()}
                            style={[
                                styles.notesCard,
                                { backgroundColor: colors.card },
                                isFocused && { borderColor: colors.primary, shadowOpacity: 0.15, shadowRadius: 6 }
                            ]}
                        >
                            <View style={styles.notesHeader}>
                                <FontAwesomeIcon icon={faNoteSticky} color={isFocused ? colors.primary : colors.textMuted} size={16} />
                                <Text className="font-redditsans-bold" style={[styles.notesLabel, { color: colors.textSecondary }, isFocused && { color: colors.primary }]}>{t("habit_details.notes_label")}</Text>
                                {(note !== (userHabit?.note || "")) && (
                                    <TouchableOpacity
                                        onPress={handleSaveNote}
                                        style={[styles.saveNoteBtn, { backgroundColor: colors.primary + '15', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 }]}
                                    >
                                        <Text className="font-redditsans-bold" style={[styles.saveNoteText, { color: colors.primary }]}>{t("common.save")}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <TextInput
                                ref={noteInputRef}
                                value={note}
                                onChangeText={setNote}
                                placeholder={t("habit_details.notes_placeholder")}
                                placeholderTextColor={colors.textMuted}
                                multiline
                                style={[styles.notesInput, { color: colors.text }]}
                                className="font-redditsans-medium"
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                            />
                        </Pressable>
                    )}

                    {weeklyProgress && (
                        <HabitProgressCard
                            habit={userHabit}
                            weeklyData={weeklyProgress}
                            title={t("habit_details.weekly_performance")}
                            weeklyStats={weeklyStats}
                        />
                    )}

                </ScrollView>

            </LinearGradient>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 20
    },
    modalContent: {
        width: "100%", maxWidth: 340, borderRadius: 24, padding: 24, alignItems: "center",
        elevation: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8
    },
    warningIconContainer: {
        width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center", marginBottom: 16
    },
    modalTitle: {
        fontSize: 22, marginBottom: 12, textAlign: "center"
    },
    modalMessage: {
        fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 28, paddingHorizontal: 10
    },
    modalActions: {
        flexDirection: "row", gap: 12, width: "100%"
    },
    modalButton: {
        flex: 1, height: 52, borderRadius: 16, justifyContent: "center", alignItems: "center"
    },
    ghostButton: {
        backgroundColor: "transparent"
    },
    deleteButton: {
        elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4
    },
    buttonText: {
        fontSize: 16
    },
    header: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14,
    },
    headerTitle: {
        fontSize: 20, color: "#111827", letterSpacing: 0.1
    },
    headerSubtitle: {
        fontSize: 13, color: "#6b7280"
    },
    headerActions: {
        flexDirection: "row", gap: 12
    },
    iconCircle: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff",
        alignItems: "center", justifyContent: "center",
        elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15, shadowRadius: 2
    },
    scrollContent: {
        paddingHorizontal: 20, paddingBottom: 80
    },
    statsRowSideBySide: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 4,
    },
    titleSection: {
        marginTop: 12, marginBottom: 16
    },
    habitTitle: {
        fontSize: 32, color: "#111827", letterSpacing: -0.5
    },
    habitDesc: {
        fontSize: 16, color: "#4b5563", marginTop: 8, lineHeight: 22
    },
    tag: {
        backgroundColor: "rgba(255,255,255,0.6)", paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 8, alignSelf: "flex-start", marginTop: 12
    },
    tagText: {
        fontSize: 12, color: "#4b5563"
    },
    notesCard: {
        backgroundColor: "#fff", borderRadius: 16, padding: 16,
        marginBottom: 20, borderWidth: 1.5, borderColor: "transparent",
        elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 4
    },
    notesCardFocused: {
        borderColor: "#2f6f3f",
        shadowOpacity: 0.15, shadowRadius: 6
    },
    notesHeader: {
        flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10
    },
    notesLabel: {
        fontSize: 13, color: "#6b7280", letterSpacing: 0.5
    },
    notesInput: {
        fontSize: 15, color: "#111827", minHeight: 80, textAlignVertical: "top",
        padding: 0
    },
    futureNotice: {
        backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 16, padding: 20,
        marginBottom: 20, alignItems: "center", borderStyle: 'dashed',
        borderWidth: 1, borderColor: '#9ca3af'
    },
    noNoteText: {
        fontSize: 14, fontStyle: 'italic', textAlign: 'center', marginTop: 8
    },
    saveNoteBtn: {
        marginLeft: 'auto',
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    boldText: {
    },
    saveNoteText: {
        fontSize: 14,
    },
    futureNoticeText: {
        fontSize: 14, color: "#4b5563", textAlign: "center", fontStyle: 'italic',
        lineHeight: 20
    },
    historyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderStyle: 'dashed'
    },
    historyButtonText: {
        fontSize: 14,
    }
});


export default UserHabitDetails;
