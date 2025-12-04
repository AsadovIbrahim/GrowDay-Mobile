import React, { useState, useCallback } from "react";
import { View, Text, FlatList, Dimensions, StyleSheet } from "react-native";
import { TouchableOpacity } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";
import Onboarding1 from "../../../assets/images/Onboarding1.svg";
import Onboarding2 from "../../../assets/images/Onboarding2.svg";
import Onboarding3 from "../../../assets/images/Onboarding3.svg";
import { useNavigation } from "@react-navigation/native";
import { storage } from "../../utils/MMKVStore";

const { width } = Dimensions.get("window");

export default function Onboarding() {
  const [activeIndex, setActiveIndex] = useState(0);
  const navigation=useNavigation();

  const data = [
    {
      title: "create\ngood habits",
      description:
      "Change your life by slowly adding new healthy habits and sticking to them",
      image: Onboarding1,
    },
    {
      title: "track\nyour progress",
      description:
        "Change your life by slowly adding new healthy habits and sticking to them",
      image: Onboarding2,
    },
    {
      title: "achieve\nyour goals",
      description:
        "Change your life by slowly adding new healthy habits and sticking to them",
      image: Onboarding3,
    },
  ];

  const viewabilityConfig = { itemVisiblePercentThreshold: 50 };

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }, []);

  const animatedButton = useAnimatedStyle(() => {
    const isLast = activeIndex === data.length - 1;

    return {
      opacity: withTiming(isLast ? 1 : 0, { duration: 300 }),
      transform: [
        {
          translateY: withTiming(isLast ? 0 : 30, { duration: 300 }),
        },
      ],
    };
  });

  return (
    <LinearGradient
      colors={["#E9E6D7", "rgba(32, 137, 58, 1)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <View className="flex-1 items-center justify-center">
        <FlatList
          data={data}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={{ width }} className="pt-36 px-10">
              <View className="w-full items-center mb-6">
                {item.image && <item.image height={300} />}
              </View>

              <View className="w-full pl-5 gap-5">
                <Text
                  className="text-5xl font-redditsans-bold text-white capitalize"
                >
                  {item.title}
                </Text>

                <Text
                  className="text-lg font-redditsans-regular text-white mt-3"
                >
                  {item.description}
                </Text>
              </View>
            </View>
          )}
        />

        <View className="gap-5" style={styles.dotContainer}>
          {data.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === activeIndex ? "#5CA72E" : "white" },
              ]}
            />
          ))}
        </View>

        <Animated.View
          style={[animatedButton]}
          className="p-5 absolute bottom-0 left-0 right-0"
        >
          <TouchableOpacity className="bg-[#83BB7B] p-5 rounded-full" onPress={()=>{
            storage.set("isOnBoardingShown")
            navigation.navigate("Login")}}>
            <Text className="text-center text-white text-2xl font-redditsans-bold">
              Get Started
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  dotContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 130,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 6,
    marginHorizontal: 5,
  },
});
