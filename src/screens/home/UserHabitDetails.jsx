import { View, Text, Pressable, ScrollView, TouchableOpacity, TextInput } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowLeft, faEdit, faTrash, faFire } from "@fortawesome/free-solid-svg-icons";
import { getUserHabitByIdFetch } from "../../utils/fetch";
import { useMMKVString } from "react-native-mmkv";
import { useEffect, useState } from "react";
import Svg, { Circle } from "react-native-svg";

// ---------- Clean SVG Circular Progress ----------
const CircularProgress = ({ percent = 75, size = 120, strokeWidth = 11, color = "#2f6f3f" }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percent / 100) * circumference;
    const center = size / 2;

    return (
        <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
            <Svg width={size} height={size} style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
                {/* Track */}
                <Circle
                    cx={center} cy={center} r={radius}
                    stroke="#e5e7eb" strokeWidth={strokeWidth} fill="none"
                />
                {/* Progress */}
                <Circle
                    cx={center} cy={center} r={radius}
                    stroke={color} strokeWidth={strokeWidth} fill="none"
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                />
            </Svg>
            <Text style={{ fontSize: 22, fontWeight: "800", color: "#111827" }}>{percent}%</Text>
        </View>
    );
};

// ---------- Weekly Bar Chart ----------
const DAYS = ["F", "S", "S", "M", "T", "W", "T"];

const WeeklyChart = ({ data }) => {
    const maxVal = Math.max(...data.map(d => d.value), 1);
    return (
        <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 68, marginTop: 20 }}>
            {data.map((d, i) => {
                const barH = Math.max((d.value / maxVal) * 52, 8);
                const bg = d.isToday ? "#ef4444" : d.active ? "#2f6f3f" : "#d1d5db";
                return (
                    <View key={i} style={{ alignItems: "center", flex: 1 }}>
                        <View style={{ width: 14, height: barH, borderRadius: 7, backgroundColor: bg }} />
                        <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>{DAYS[i]}</Text>
                    </View>
                );
            })}
        </View>
    );
};

// ---------- Main Screen ----------
const weeklyData = [
    { value: 80, active: true },
    { value: 90, active: true },
    { value: 70, active: true },
    { value: 95, active: true },
    { value: 40, active: false, isToday: true },
    { value: 30, active: false },
    { value: 20, active: false },
];

const UserHabitDetails = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const [userHabit, setUserHabit] = useState(null);
    const [note, setNote] = useState("");
    const [token] = useMMKVString("accessToken");

    useEffect(() => {
        const load = async () => {
            try {
                const habitId = route.params?.habitId;
                if (!habitId || !token) return;
                const response = await getUserHabitByIdFetch(token, habitId);
                if (response?.data) setUserHabit(response.data);
            } catch (e) {
                console.log("Habit fetch error:", e);
            }
        };
        load();
    }, []);

    const streakDays = userHabit?.streakCount ?? 12;
    const frequency = userHabit?.frequency ?? "Daily";

    return (
        <LinearGradient colors={["#d8ead0", "#2f6f3f"]} style={{ flex: 1 }}>

            {/* ── Header ── */}
            <View style={{
                flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14,
            }}>
                <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
                    <FontAwesomeIcon icon={faArrowLeft} color="#111827" size={21} />
                </Pressable>
                <Text style={{ fontSize: 17, fontWeight: "700", color: "#111827", letterSpacing: 0.2 }}>
                    Habit Details
                </Text>
                <View style={{ flexDirection: "row", gap: 16 }}>
                    <Pressable hitSlop={12}>
                        <FontAwesomeIcon icon={faEdit} color="#111827" size={18} />
                    </Pressable>
                    <Pressable hitSlop={12}>
                        <FontAwesomeIcon icon={faTrash} color="#111827" size={18} />
                    </Pressable>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}
            >
                {/* ── Title ── */}
                <View style={{ marginTop: 8, marginBottom: 22 }}>
                    <Text style={{ fontSize: 28, fontWeight: "800", color: "#111827" }}>
                        {userHabit?.title ?? "Loading..."}{" "}
                        <Text style={{ fontSize: 24 }}>💧</Text>
                    </Text>
                    <Text style={{ fontSize: 14, color: "#374151", marginTop: 5 }}>
                        {frequency} Habit
                    </Text>
                </View>

                {/* ── Stats Card ── */}
                <View style={{
                    backgroundColor: "#fff",
                    borderRadius: 22,
                    padding: 22,
                    marginBottom: 16,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.07,
                    shadowRadius: 10,
                    elevation: 4,
                }}>
                    {/* Row: progress circle + numbers */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 22 }}>
                        <CircularProgress percent={75} size={120} strokeWidth={11} color="#2f6f3f" />
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 20, fontWeight: "800", color: "#111827", lineHeight: 26 }}>
                                500 / 2000 ML
                            </Text>
                            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, gap: 5 }}>
                                <FontAwesomeIcon icon={faFire} color="#f59e0b" size={14} />
                                <Text style={{ fontSize: 13, color: "#6b7280" }}>
                                    Streak{" "}
                                    <Text style={{ color: "#111827", fontWeight: "700" }}>{streakDays} days</Text>
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Weekly bars */}
                    <WeeklyChart data={weeklyData} />
                </View>

                {/* ── Notes ── */}
                <View style={{
                    backgroundColor: "#fff",
                    borderRadius: 22,
                    paddingHorizontal: 18,
                    paddingVertical: 16,
                    marginBottom: 26,
                    minHeight: 90,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 6,
                    elevation: 3,
                }}>
                    <TextInput
                        value={note}
                        onChangeText={setNote}
                        placeholder="Today I drank 1.5L of water and felt great."
                        placeholderTextColor="#9ca3af"
                        multiline
                        style={{ fontSize: 14, color: "#111827", lineHeight: 22 }}
                    />
                </View>

                {/* ── Mark as Done ── */}
                <TouchableOpacity
                    activeOpacity={0.85}
                    style={{
                        backgroundColor: "#2f6f3f",
                        borderRadius: 50,
                        paddingVertical: 18,
                        alignItems: "center",
                        shadowColor: "#2f6f3f",
                        shadowOffset: { width: 0, height: 5 },
                        shadowOpacity: 0.35,
                        shadowRadius: 10,
                        elevation: 7,
                    }}
                >
                    <Text style={{ fontSize: 17, fontWeight: "700", color: "#fff", letterSpacing: 0.3 }}>
                        Mark as done
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </LinearGradient>
    );
};

export default UserHabitDetails;
