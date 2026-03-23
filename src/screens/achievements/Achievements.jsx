import React from "react";
import { View, Text, ScrollView } from "react-native";
import { useMMKVString } from "react-native-mmkv";
import { useState } from "react";
import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { TouchableOpacity } from "react-native";
import { getAllAchievementsFetch } from "../../utils/fetch";
import AchievementCard from "../../components/AchievementCard";

const Achievements = () => {
  const [token] = useMMKVString('accessToken');

  const navigation = useNavigation();

  const [achievements, setAchievements] = useState([]);

  const getAchievementsAsync=async()=>{
    try{
      const response = await getAllAchievementsFetch(token);
      console.log(response.data);
      setAchievements(response.data);
    }
    catch(error){
      console.log(error);
    }
  }

  useEffect(() => {
    getAchievementsAsync();
  }, []);

  const handleGoBack = (() => {
    navigation.goBack();
  });

  return (
    <LinearGradient colors={["#e7f0df", "#2f6f3f"]} className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-5 pt-8 mb-6">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={handleGoBack} className="mr-4">
              <FontAwesomeIcon icon={faArrowLeft} size={22} color="#111827" />
            </TouchableOpacity>
            <Text className="text-[26px] font-redditsans-bold text-gray-900 tracking-tight">
              Achievements
            </Text>
          </View>

          <TouchableOpacity>
            <Text className="text-[12px] font-redditsans-bold tracking-widest text-green-700 uppercase mt-1">
              VIEW ALL
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {achievements.map((item) => (
            <AchievementCard
              key={item.achievementId}
              title={item.title}
              description={item.description}
              streakLabel={`${item.streakRequired} days`}
              pointsLabel={`${item.pointsRequired} XP`}
              isUnlocked={item.isUnlocked}
            />
          ))}
        </ScrollView>
      </SafeAreaView>

    </LinearGradient>
  );
};

export default Achievements;

