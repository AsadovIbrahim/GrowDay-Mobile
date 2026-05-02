import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Modal, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowLeft, faCheck } from "@fortawesome/free-solid-svg-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { storage } from "../../utils/MMKVStore";
import { createUserPreferencesWithAIFetch, updateUserPreferencesWithAIFetch } from "../../utils/fetch";
import { useTheme } from "../../context/ThemeContext";

const UserPref7 = () => {
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const route = useRoute();
  const navigation = useNavigation();

  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const loadingMessages = [
    "Syncing with your energy levels...",
    "Analyzing focus patterns...",
    "Brainstorming perfect routines...",
    "Finalizing your AI blueprint...",
    "Almost there, magic is happening..."
  ];

  React.useEffect(() => {
    let interval;
    if (isLoading) {
      setLoadingStep(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
      interval = setInterval(() => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
          setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
          Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        });
      }, 3000);
    } else {
      fadeAnim.setValue(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const isUpdate = route.params?.isUpdate;
  const initialData = route.params?.initialData;
  const previousPreferences = route.params?.preferences || {};

  // Initialize from initialData if it's an update
  const [selectedGoals, setSelectedGoals] = useState(() => {
    if (initialData?.mainGoal) {
      if (typeof initialData.mainGoal === 'string') {
        return initialData.mainGoal.split(",").map(g => g.trim());
      }
      return [initialData.mainGoal];
    }
    return ["Productivity"];
  });

  const goals = [
    { id: "Productivity", label: "Productivity", icon: "🚀" },
    { id: "Fitness", label: "Fitness & Health", icon: "💪" },
    { id: "Learning", label: "Learning", icon: "📚" },
    { id: "MentalHealth", label: "Mental Health", icon: "🧘" },
    { id: "SelfImprovement", label: "Self Improvement", icon: "🌟" },
  ];

  const toggleGoal = (goalId) => {
    setSelectedGoals(prev => {
      if (prev.includes(goalId)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter(id => id !== goalId);
      }
      return [...prev, goalId];
    });
  };

  const handleSubmit = async () => {
    try {
      const normalizeString = (str) => String(str || "").trim();
      const normalizeCSV = (str) => {
        if (!str) return "";
        return str.split(',').map(s => s.trim()).filter(s => s).sort().join(',');
      };

      const currentMainGoal = normalizeCSV(selectedGoals.join(","));
      
      // If it's an update, check if anything actually changed
      if (isUpdate && initialData) {
        const initialWakeUp = initialData.wakeUpTime?.split(':').slice(0, 2).join(':') || "07:00";
        const currentWakeUp = `${String(previousPreferences.wakeUpHour || 7).padStart(2, "0")}:${String(previousPreferences.wakeUpMinute || 0).padStart(2, "0")}`;
        
        const initialSleep = initialData.sleepTime?.split(':').slice(0, 2).join(':') || "22:00";
        const currentSleep = `${String(previousPreferences.endOfDayHour || 22).padStart(2, "0")}:${String(previousPreferences.endOfDayMinute || 0).padStart(2, "0")}`;

        const initialMotiv = normalizeCSV(initialData.motivationalFactors || "None");
        const currentMotiv = normalizeCSV(previousPreferences.motivationalFactors || "None");

        const initialGoal = normalizeCSV(initialData.mainGoal || "");

        const hasChanged = 
          initialWakeUp !== currentWakeUp ||
          initialSleep !== currentSleep ||
          normalizeString(initialData.procrestinateFrequency) !== normalizeString(previousPreferences.procrastinationFrequency) ||
          normalizeString(initialData.focusDifficulty) !== normalizeString(previousPreferences.focusDifficulty) ||
          initialMotiv !== currentMotiv ||
          normalizeString(initialData.gender) !== normalizeString(previousPreferences.gender) ||
          Number(initialData.age || 0) !== Number(previousPreferences.age || 0) ||
          initialGoal !== currentMainGoal;

        console.log("--- DEBUG COMPARISON ---");
        console.log("WakeUp:", initialWakeUp, "==", currentWakeUp);
        console.log("Sleep:", initialSleep, "==", currentSleep);
        console.log("Procrastin:", initialData.procrestinateFrequency, "==", previousPreferences.procrastinationFrequency);
        console.log("Focus:", initialData.focusDifficulty, "==", previousPreferences.focusDifficulty);
        console.log("Motiv:", initialMotiv, "==", currentMotiv);
        console.log("Gender:", initialData.gender, "==", previousPreferences.gender);
        console.log("Age:", initialData.age, "==", previousPreferences.age);
        console.log("Goal:", initialGoal, "==", currentMainGoal);
        console.log("FINAL HAS CHANGED:", hasChanged);

        if (!hasChanged) {
          Alert.alert("No Changes", "Your preferences are already up to date.");
          navigation.navigate("Profile"); 
          return;
        }
      }

      setIsLoading(true);
      const accessToken = storage.getString("accessToken");
      if (!accessToken) {
        Alert.alert("Error", "Authentication token not found. Please login again.");
        setIsLoading(false);
        return;
      }

      const payload = {
        wakeUpTime: `${String(previousPreferences.wakeUpHour || 7).padStart(2, "0")}:${String(previousPreferences.wakeUpMinute || 0).padStart(2, "0")}:00`,
        sleepTime: `${String(previousPreferences.endOfDayHour || 22).padStart(2, "0")}:${String(previousPreferences.endOfDayMinute || 0).padStart(2, "0")}:00`,
        procrestinateFrequency: previousPreferences.procrastinationFrequency || "Sometimes",
        focusDifficulty: previousPreferences.focusDifficulty || "Occasionally",
        motivationalFactors: previousPreferences.motivationalFactors || "None",
        gender: previousPreferences.gender || "Male",
        age: previousPreferences.age || 25,
        mainGoal: currentMainGoal
      };

      const response = isUpdate 
        ? await updateUserPreferencesWithAIFetch(accessToken, payload)
        : await createUserPreferencesWithAIFetch(accessToken, payload);
      
      if (response && !response.error && response.success !== false) {
        setIsLoading(false);
        setTimeout(() => setShowSuccessModal(true), 500);
      } else {
        setIsLoading(false);
        Alert.alert("Error", response?.message || "Failed to save preferences. Please try again.");
      }
    } catch (error) {
      setIsLoading(false);
      Alert.alert("Error", "An error occurred while saving your preferences. Please try again.");
    }
  };

  return (
    <LinearGradient colors={isDark ? ["#0a0f0b", "#1a2e1c"] : ["#e7f0df", "#2f6f3f"]} className="flex-1 px-5">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center mt-4 mb-8">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <FontAwesomeIcon icon={faArrowLeft} size={20} color={isDark ? "#ffffff" : "#1f2937"} />
          </TouchableOpacity>
          <View className="flex-1 h-2 bg-black/10 rounded-full mx-4">
            <View className="w-full h-full bg-green-500 rounded-full" />
          </View>
          <Text style={{ color: colors.textSecondary }} className="font-semibold font-redditsans-bold">8/8</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <View className="items-center mb-6">
            <Text style={{ color: colors.text }} className="text-[26px] font-redditsans-bold text-center">
              What are your
            </Text>
            <Text className="text-[26px] font-redditsans-bold text-green-500 text-center">
              main goals right now?
            </Text>
            <Text style={{ color: colors.textSecondary }} className="text-[13px] font-redditsans-regular mt-2">
              Select all that apply to you
            </Text>
          </View>

          <View className="mb-8">
            {goals.map((goal) => {
              const isSelected = selectedGoals.includes(goal.id);
              return (
                <TouchableOpacity
                  key={goal.id}
                  onPress={() => toggleGoal(goal.id)}
                  className={`flex-row items-center p-5 mb-4 rounded-2xl ${
                    isSelected ? "border-2 border-green-500" : isDark ? "border border-white/10" : "border border-green-100"
                  }`}
                  style={{ 
                    backgroundColor: isDark ? "#1a2e1c" : "#ffffff",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isSelected ? 0.2 : 0.05,
                    shadowRadius: 4,
                    elevation: 3
                  }}
                >
                  <View className="flex-row items-center flex-1">
                    <Text className="text-2xl mr-4">{goal.icon}</Text>
                    <Text style={{ 
                      color: colors.text,
                      fontSize: 18,
                      fontWeight: isSelected ? "700" : "500"
                    }} className="font-redditsans-bold">
                      {goal.label}
                    </Text>
                  </View>
                  {isSelected && (
                    <FontAwesomeIcon icon={faCheck} size={18} color="#22c55e" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View className="flex-1" />

          <TouchableOpacity onPress={handleSubmit} disabled={isLoading} className="bg-[#8bc37a] py-5 rounded-full mb-6">
            {isLoading ? <ActivityIndicator color="#ffffff" /> : <Text className="text-white text-center font-redditsans-bold text-[16px]">Complete</Text>}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      {/* AI OVERLAY */}
      <Modal visible={isLoading} transparent animationType="none">
        <View style={{ flex: 1, backgroundColor: 'rgba(23, 42, 28, 0.98)', justifyContent: 'center', alignItems: 'center' }}>
          <Animated.View style={{ position: 'absolute', opacity: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.3] }) }}>
            <Text style={{ fontSize: 120 }}>✨</Text>
          </Animated.View>
          <View style={{ width: '80%', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#8bc37a" style={{ marginBottom: 40, transform: [{ scale: 1.8 }] }} />
            <Text style={{ color: 'white', fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 10, letterSpacing: 2 }}>GENESIS AI</Text>
            <View style={{ height: 50, justifyContent: 'center' }}>
              <Animated.Text style={{ color: '#8bc37a', fontSize: 17, textAlign: 'center', fontWeight: '600', opacity: fadeAnim }}>
                {loadingMessages[loadingStep]}
              </Animated.Text>
            </View>
            <View style={{ marginTop: 60, width: '100%', height: 3, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
               <Animated.View 
                  style={{ 
                    height: '100%', 
                    backgroundColor: '#8bc37a', 
                    width: '100%',
                    transform: [{
                      translateX: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-300, 0]
                      })
                    }]
                  }} 
               />
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 25, textAlign: 'center', letterSpacing: 3, textTransform: 'uppercase' }}>
              Optimizing your routine
            </Text>
          </View>
        </View>
      </Modal>

      {/* SUCCESS MODAL */}
      <Modal visible={showSuccessModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: isDark ? colors.card : 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30, alignItems: 'center', minHeight: '50%' }}>
            <View style={{ width: 60, height: 60, backgroundColor: '#8bc37a', borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
               <FontAwesomeIcon icon={faCheck} size={30} color="white" />
            </View>
            <Text style={{ fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 15 }}>
              {isUpdate ? "Routine Updated!" : "Routine is Ready!"}
            </Text>
            <Text style={{ fontSize: 16, color: colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 30 }}>
              {isUpdate ? "Your preferences have been updated and AI has re-optimized your routine." : "Genesis AI has successfully crafted a personalized routine tailored to your goals and lifestyle."}
            </Text>
            <TouchableOpacity onPress={() => { if (isUpdate) { setShowSuccessModal(false); navigation.navigate("Profile"); } else { storage.set("isFirstTimeExplore", true); storage.set("hasCompletedPreferences", true); } }} className="bg-[#2f6f3f] w-full py-4 rounded-2xl">
              <Text className="text-white text-center font-redditsans-bold text-[18px]">Explore My Routine</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

export default UserPref7;
