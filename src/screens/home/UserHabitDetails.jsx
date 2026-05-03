import { View, Text, Pressable, ScrollView, TextInput, StyleSheet, Alert, Modal } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowLeft, faEdit, faTrash, faNoteSticky, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { getUserHabitByIdFetch, getWeeklyProgressFetch, removeUserHabitFetch } from "../../utils/fetch";
import { useMMKVString } from "react-native-mmkv";
import { useEffect, useState } from "react";
import { ICONS } from "../../constants/icons";
import { TouchableOpacity } from "react-native";
import HabitProgressCard from "./components/HabitProgressCard";
import HabitActionSection from "./components/HabitActionSection";
import { useTheme } from '../../context/ThemeContext';

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
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const { theme } = useTheme();
    const { colors } = theme;
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

    const isAlreadyDone = userHabit?.lastCompletedDate && 
        new Date(userHabit.lastCompletedDate).toDateString() === new Date().toDateString();

    const isProgressCompleted = userHabit && (userHabit.progressPercentage >= 100);

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
            if (response?.data) {
                setUserHabit(response.data);
                setLiveDelta(0); // Reset live delta ONLY after we have the new baseline from server
            }
        } catch (e) {
            console.log("Habit fetch error:", e);
        }
    };

    const handleDelete = () => {
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            setIsDeleting(true);
            const habitId = route.params?.habitId;
            if (!habitId || !token) return;
            const response = await removeUserHabitFetch(token, habitId);
            if (response) {
                setShowDeleteModal(false);
                navigation.navigate("Home", { screen: "HomeScreen" });
            }
        } catch (error) {
            console.log("Delete error:", error);
            Alert.alert("Error", "Failed to delete habit.");
        } finally {
            setIsDeleting(false);
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
        <LinearGradient colors={colors.backgroundGradient} style={{ flex: 1 }}>

            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={[styles.iconCircle, { backgroundColor: colors.card }]} hitSlop={10}>
                    <FontAwesomeIcon icon={faArrowLeft} color={colors.text} size={18} />
                </Pressable>
                <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Habit Details</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Track your daily progress</Text>
                </View>
                <View style={styles.headerActions}>
                    {!isFutureDate && (
                        <>
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
                             <Pressable 
                                onPress={handleDelete}
                                style={[styles.iconCircle, { backgroundColor: colors.dangerSurface }]} 
                                hitSlop={10}
                             >
                                 <FontAwesomeIcon icon={faTrash} color={colors.danger} size={16} />
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
                    <Text className="text-4xl font-redditsans-bold" style={[styles.mainTitle, { color: colors.text }]}>
                        {userHabit?.title ?? "Loading..."}{" "}
                        {ICONS[userHabit?.icon]}
                    </Text>
                    <Text className="font-redditsans-regular" style={[styles.descriptionText, { color: colors.textSecondary }]}>
                        {userHabit?.description}
                    </Text>

                    <View style={styles.tagRow}>
                        <View style={[styles.tag, { backgroundColor: colors.cardSecondary }]}>
                            <Text style={[styles.tagText, { color: colors.textSecondary }]}>
                                {userHabit?.frequency ?? "Daily"}
                            </Text>
                        </View>
                    </View>
                </View>

                <HabitProgressCard 
                    habit={userHabit} 
                    weeklyData={weeklyDataPlaceholder} 
                    liveDelta={liveDelta}
                    title={isFutureDate ? "Upcoming Performance" : "Today's Performance"}
                />

                {weeklyProgress && (
                    <HabitProgressCard 
                        habit={userHabit} 
                        weeklyData={weeklyProgress} 
                        title="Weekly Performance"
                        weeklyStats={weeklyStats}
                    />
                )}



                {isFutureDate ? (
                    <View style={[styles.futureNotice, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}>
                        <Text style={[styles.futureNoticeText, { color: colors.textSecondary }]}>
                            You can start tracking this habit on the selected day.
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

                {!isFutureDate && !isFullyCompleted && (
                    <View style={[styles.notesCard, { backgroundColor: colors.card }, isFocused && { borderColor: colors.primary, shadowOpacity: 0.15, shadowRadius: 6 }]}>
                        <View style={styles.notesHeader}>
                            <FontAwesomeIcon icon={faNoteSticky} color={isFocused ? colors.primary : colors.textMuted} size={16} />
                            <Text style={[styles.notesLabel, { color: colors.textSecondary }, isFocused && { color: colors.primary }]}>Today's Notes</Text>
                        </View>
                        <TextInput
                            value={note}
                            onChangeText={setNote}
                            placeholder="Add a note..."
                            placeholderTextColor={colors.textMuted}
                            multiline
                            style={[styles.notesInput, { color: colors.text }]}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                        />
                    </View>
                )}
                
            </ScrollView>

            {/* Modern Delete Confirmation Modal */}
            <Modal
                visible={showDeleteModal}
                transparent
                animationType="fade"
                onRequestClose={() => !isDeleting && setShowDeleteModal(false)}
            >
                <Pressable 
                    style={styles.modalOverlay}
                    onPress={() => !isDeleting && setShowDeleteModal(false)}
                >
                    <Pressable 
                        style={[styles.modalContent, { backgroundColor: colors.card }]}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View style={[styles.warningIconContainer, { backgroundColor: colors.dangerSurface }]}>
                            <FontAwesomeIcon icon={faTrash} color={colors.danger} size={28} />
                        </View>
                        
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            {`Delete "${userHabit?.title}"?`}
                        </Text>
                        
                        <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
                            <Text>
                                This will <Text style={{ fontWeight: "700", color: colors.text }}>permanently</Text> remove your progress, streaks, and history. This action <Text style={{ fontWeight: "700", color: colors.text }}>cannot be undone</Text>.
                            </Text>
                        </Text>

                        <View style={styles.modalActions}>
                            <TouchableOpacity 
                                onPress={() => setShowDeleteModal(false)}
                                disabled={isDeleting}
                                style={[styles.modalButton, styles.ghostButton]}
                            >
                                <Text style={[styles.buttonText, { color: colors.textSecondary }]}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                onPress={confirmDelete}
                                disabled={isDeleting}
                                style={[styles.modalButton, styles.deleteButton, { backgroundColor: colors.danger }]}
                            >
                                <Text style={[styles.buttonText, { color: "#fff" }]}>
                                    {isDeleting ? "Deleting..." : "Delete Habit"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </LinearGradient>
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
        fontSize: 22, fontWeight: "700", marginBottom: 12, textAlign: "center"
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
        fontSize: 16, fontWeight: "600"
    },
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
    },
    futureNotice: {
        backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 16, padding: 20,
        marginBottom: 20, alignItems: "center", borderStyle: 'dashed',
        borderWidth: 1, borderColor: '#9ca3af'
    },
    futureNoticeText: {
        fontSize: 14, color: "#4b5563", textAlign: "center", fontStyle: 'italic',
        lineHeight: 20
    }
});

export default UserHabitDetails;
