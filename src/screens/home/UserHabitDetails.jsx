import { View, Text, Pressable, ScrollView, TextInput, StyleSheet } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowLeft, faEdit, faTrash, faNoteSticky } from "@fortawesome/free-solid-svg-icons";
import { getUserHabitByIdFetch, getWeeklyProgressFetch } from "../../utils/fetch";
import { useMMKVString } from "react-native-mmkv";
import { useEffect, useState } from "react";
import { ICONS } from "../../constants/icons";
import HabitProgressCard from "./components/HabitProgressCard";
import HabitActionSection from "./components/HabitActionSection";

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
    const [weeklyProgress, setWeeklyProgress] = useState(null);
    const [weeklyStats, setWeeklyStats] = useState(null);
    const [note, setNote] = useState("");
    const [liveDelta, setLiveDelta] = useState(0);
    const [token] = useMMKVString("accessToken");
    const [isFocused, setIsFocused] = useState(false);

    const isAlreadyDone = userHabit?.lastCompletedDate && 
        new Date(userHabit.lastCompletedDate).toDateString() === new Date().toDateString();

    const isProgressCompleted = userHabit && (
        (userHabit.progressPercentage >= 100) || 
        ((userHabit.currentValue ?? 0) + liveDelta >= (userHabit.targetValue ?? 0))
    );

    const isFullyCompleted = isAlreadyDone || isProgressCompleted;

    useEffect(() => {
        const habitId = route.params?.habitId;
        const date = route.params?.date;
        if (habitId) {
            getUserHabitById(habitId, date);
            getWeeklyProgress(habitId);
        }
    }, []);

    const getUserHabitById = async (habitId, date = null) => {
        try {
            if (!token) return;
            const response = await getUserHabitByIdFetch(token, habitId, date);
            if (response?.data) setUserHabit(response.data);
        } catch (e) {
            console.log("Habit fetch error:", e);
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
            console.log("Weekly progress fetch error:", e);
        }
    };


    return (
        <LinearGradient colors={["#d8ead0", "#2f6f3f"]} style={{ flex: 1 }}>

            {/* ── Header ── */}
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.iconCircle} hitSlop={10}>
                    <FontAwesomeIcon icon={faArrowLeft} color="#374151" size={18} />
                </Pressable>
                <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={styles.headerTitle}>Habit Details</Text>
                    <Text style={styles.headerSubtitle}>Track your daily progress</Text>
                </View>
                <View style={styles.headerActions}>
                    <Pressable style={styles.iconCircle} hitSlop={10}>
                        <FontAwesomeIcon icon={faEdit} color="#4b5563" size={16} />
                    </Pressable>
                    <Pressable style={[styles.iconCircle, { backgroundColor: "#fee2e2" }]} hitSlop={10}>
                        <FontAwesomeIcon icon={faTrash} color="#ef4444" size={16} />
                    </Pressable>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* ── Title ── */}
                <View style={styles.titleSection}>
                    <Text className="text-4xl font-redditsans-bold" style={styles.mainTitle}>
                        {userHabit?.title ?? "Loading..."}{" "}
                        {ICONS[userHabit?.icon]}
                    </Text>
                    <Text className="font-redditsans-regular" style={styles.descriptionText}>
                        {userHabit?.description}
                    </Text>

                    <View style={styles.tagRow}>
                        <View style={styles.tag}>
                            <Text style={styles.tagText}>
                                {userHabit?.frequency ?? "Daily"}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ── Stats Card 1 (Current) ── */}
                <HabitProgressCard 
                    habit={userHabit} 
                    weeklyData={weeklyDataPlaceholder} 
                    liveDelta={liveDelta}
                    title="Today's Performance"
                />

                {/* ── Stats Card 2 (API Weekly Progress) ── */}
                {weeklyProgress && (
                    <HabitProgressCard 
                        habit={userHabit} 
                        weeklyData={weeklyProgress} 
                        title="Weekly Performance"
                        weeklyStats={weeklyStats}
                    />
                )}



                {/* ── Dynamic Action Section ── */}
                {userHabit && !isFullyCompleted && (
                    <HabitActionSection 
                        habit={userHabit}
                        token={token}
                        note={note}
                        onActionComplete={() => {
                            setLiveDelta(0);
                            getUserHabitById();
                        }}
                        onLiveUpdate={setLiveDelta}
                    />
                )}

                {/* ── Notes ── */}
                {!isFullyCompleted && (
                    <View style={[styles.notesCard, isFocused && styles.notesCardFocused]}>
                        <View style={styles.notesHeader}>
                            <FontAwesomeIcon icon={faNoteSticky} color={isFocused ? "#2f6f3f" : "#9ca3af"} size={16} />
                            <Text style={[styles.notesLabel, isFocused && { color: "#2f6f3f" }]}>Today's Notes</Text>
                        </View>
                        <TextInput
                            value={note}
                            onChangeText={setNote}
                            placeholder="Add a note..."
                            placeholderTextColor="#9ca3af"
                            multiline
                            style={styles.notesInput}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                        />
                    </View>
                )}
                
            </ScrollView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14,
    },
    headerTitle: {
        fontSize: 22, fontWeight: "700", color: "#111827", letterSpacing: 0.1
    },
    headerSubtitle: {
        fontSize: 13, color: "#6b7280", marginTop: 2, fontWeight: "500"
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
    titleSection: {
        marginTop: 12, marginBottom: 28
    },
    habitTitle: {
        fontSize: 40, fontWeight: "900", color: "#111827", letterSpacing: -1
    },
    habitDesc: {
        fontSize: 20, color: "#4b5563", marginTop: 8, fontWeight: "600"
    },
    tag: {
        backgroundColor: "rgba(255,255,255,0.6)", paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 8, alignSelf: "flex-start", marginTop: 12
    },
    tagText: {
        fontSize: 12, fontWeight: "600", color: "#4b5563"
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
        fontSize: 13, fontWeight: "700", color: "#6b7280", letterSpacing: 0.5
    },
    notesInput: {
        fontSize: 15, color: "#111827", minHeight: 80, textAlignVertical: "top",
        padding: 0
    }
});

export default UserHabitDetails;
