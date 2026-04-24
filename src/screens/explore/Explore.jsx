import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {getUserSuggestedHabitsFetch } from "../../utils/fetch";
import { useMMKVString } from "react-native-mmkv";
import UserTasksList from "../../components/UserTasksList";

import { 
  faSearch, 
  faWalking,
  faBook,
  faWater,
  faMinus,
  faChevronRight,
  faStar
} from '@fortawesome/free-solid-svg-icons';
import SuggestedHabitCard from "../../components/SuggestedHabitCard";
import HabitAddCard from "../../components/HabitAddCard";
import HabitAddModal from "../../components/HabitAddModal";

const Explore = () => {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);
  const [suggestedHabits, setSuggestedHabits] = useState([]);
  const [token] = useMMKVString('accessToken');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(3);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(null);
  useEffect(() => {
    getUserSuggestedHabits();
  }, []);
  

  const getUserSuggestedHabits = async () => {
    try {
      setLoading(true);
      const response = await getUserSuggestedHabitsFetch(token, pageIndex, pageSize);
      console.log("Suggested habits", response.data);
      setSuggestedHabits(response.data);
    } catch (error) {
      console.log(error);
    }
    finally {
      setLoading(false);
    }
  }

  const handleOpenAddModal = (habit) => {
    setSelectedHabit(habit);
    setIsAddModalVisible(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalVisible(false);
    setSelectedHabit(null);
  };

  const handleSubmitHabit = (payload) => {
    console.log("Add habit payload", payload);
    handleCloseAddModal();
  };

  
  const learningItems = [
    { 
      id: 1, 
      title: "Why should we drink water often?",
      image: "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400"
    },
    { 
      id: 2, 
      title: "Benefits of regular walking",
      image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400"
    },
  ];
  
  return (
    <LinearGradient colors={["#e7f0df", "#2f6f3f"]} className="flex-1">
      <SafeAreaView className="flex-1">
        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Header Section */}
          <View className="flex-row items-center justify-between px-4 pt-4 mb-6">
              <Text className="text-black text-3xl font-redditsans-bold">Explore</Text>
            <TouchableOpacity 
              className="w-10 h-10 bg-gray-200 rounded-full items-center justify-center"
              style={{ backgroundColor: '#e5e7eb' }}
            >
              <FontAwesomeIcon icon={faSearch} size={18} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Suggested Habits Section */}
          <View className="px-4 mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-redditsans-bold text-black">Suggested Habits</Text>
              <TouchableOpacity className="flex-row items-center gap-1">
                <Text className="text-base text-green-600 font-redditsans-medium">VIEW ALL</Text> 
                <FontAwesomeIcon icon={faChevronRight} color="#16a34a" size={14} />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
            >
              {suggestedHabits.map((habit) => (
                <SuggestedHabitCard
                  key={habit.id}
                  name={habit.title}
                  frequency={habit.frequency}
                />
              ))}
            </ScrollView>
          </View>

          {/* Tasks Section */}
          <View className="px-4 mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center gap-2">
                <Text className="text-xl font-redditsans-bold text-black">Tasks</Text>
                <FontAwesomeIcon icon={faStar} color="#FBBF24" size={16} />
              </View>
              <TouchableOpacity 
                onPress={() => navigation.navigate('UserTasks')}
                className="flex-row items-center gap-1"
              >
                <Text className="text-base text-green-600 font-redditsans-medium">VIEW ALL</Text>
                <FontAwesomeIcon icon={faChevronRight} color="#16a34a" size={14} />
              </TouchableOpacity>
            </View>
            <UserTasksList />
            
            
          </View>

          {/* Learning Section */}
          <View className="px-4 mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-redditsans-bold text-black">Learning</Text>
              <TouchableOpacity className="flex-row items-center gap-1">
                <Text className="text-base text-green-600 font-redditsans-medium">VIEW ALL</Text>
                <FontAwesomeIcon icon={faChevronRight} color="#16a34a" size={14} />
          </TouchableOpacity>
            </View>
            
            <View className="flex-row gap-3">
              {learningItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  className="flex-1 rounded-xl overflow-hidden"
                  style={{
                    backgroundColor: '#16a34a',
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <View style={{ height: 140 }}>
                    <Image
                      source={{ uri: item.image }}
                      className="w-full h-full"
                      style={{ opacity: 0.8 }}
                      resizeMode="cover"
                    />
                  </View>
                  <View className="p-3">
                    <View className="flex-row items-center gap-2">
                      <View className="w-6 h-6 bg-white rounded-full items-center justify-center">
                        <FontAwesomeIcon icon={faMinus} size={12} color="#16a34a" />
                      </View>
                      <Text 
                        className="flex-1 text-sm font-redditsans-medium text-white"
                        numberOfLines={2}
                      >
                        {item.title}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
        </View>
        <HabitAddModal
          visible={isAddModalVisible}
          habit={selectedHabit}
          onClose={handleCloseAddModal}
          onSubmit={handleSubmitHabit}
        />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default Explore;
