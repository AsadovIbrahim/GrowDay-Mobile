import React, { useRef, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowLeft, faMoon } from "@fortawesome/free-solid-svg-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

const ITEM_HEIGHT = 56;
const VISIBLE_ITEMS = 5;
const CENTER_OFFSET = Math.floor(VISIBLE_ITEMS / 2) * ITEM_HEIGHT;

const BASE_HOURS = [...Array(12).keys()].map(i => i + 1);
const BASE_MINUTES = [...Array(60).keys()];

const HOURS = [...BASE_HOURS, ...BASE_HOURS, ...BASE_HOURS];
const MINUTES = [...BASE_MINUTES, ...BASE_MINUTES, ...BASE_MINUTES];

const UserPref2 = () => {
  const hourRef = useRef(null);
  const minuteRef = useRef(null);
  const route = useRoute();
  const navigation = useNavigation();

  const [hour, setHour] = useState(9); 
  const [minute, setMinute] = useState(0);
  
  // Get preferences from previous screen
  const previousPreferences = route.params?.preferences || {};

  useEffect(() => {
    setTimeout(() => {
      hourRef.current?.scrollTo({ y: (8 + BASE_HOURS.length) * ITEM_HEIGHT, animated: false });
      minuteRef.current?.scrollTo({ y: BASE_MINUTES.length * ITEM_HEIGHT, animated: false });
    }, 50);
  }, []);

  useEffect(() => {
    console.log("hour", hour);
    console.log("minute", minute);
  }, [hour, minute]);

  const handleScroll = (event, base, setter, ref) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const actual = index % base.length;

    setter(base[actual]);

    if (index < base.length || index >= base.length * 2) {
      ref.current?.scrollTo({
        y: (actual + base.length) * ITEM_HEIGHT,
        animated: false,
      });
    }
  };

  const renderItem = (value, selected) => (
    <View style={{ height: ITEM_HEIGHT }} className="items-center justify-center">
      <Text
        style={{
          fontSize: selected ? 30 : 18,
          fontWeight: selected ? "700" : "400",
          color: selected ? "#1f2937" : "#ffffff",
        }}
        className={selected ? "font-redditsans-bold" : "font-redditsans-regular"}
      >
        {String(value).padStart(2, "0")}
      </Text>

      {selected && (
        <View className="absolute bottom-[8px] w-12 h-[2px] bg-green-600 rounded-full" />
      )}
    </View>
  );
  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
      <LinearGradient colors={["#e7f0df", "#2f6f3f"]} className="flex-1 px-5">
        <SafeAreaView className="flex-1">

        {/* HEADER */}
        <View className="flex-row items-center mt-4 mb-8">
          <TouchableOpacity onPress={handleGoBack}>
            <FontAwesomeIcon  icon={faArrowLeft} size={20} color="#1f2937"/>
          </TouchableOpacity>

          <View className="flex-1 h-2 bg-black/10 rounded-full mx-4">
            <View className="w-2/5 h-full bg-green-500 rounded-full" />
          </View>

          <Text className="text-gray-800 font-semibold font-redditsans-bold">2/5</Text>
        </View>

        {/* TITLE */}
        <View className="items-center mb-10">

      <Text className="text-[26px] font-redditsans-bold text-gray-800 text-center">
        What time do you usually
      </Text>

      <View className="flex-row items-center justify-center">
        <Text className="text-[26px] font-redditsans-bold text-green-500">
          end your day?
        </Text>

        <FontAwesomeIcon
          icon={faMoon}
          size={20}
          color="#FFD43B"
          style={{ marginLeft: 6 , marginBottom: -6 }}
        />
      </View>

      <Text className="text-[13px] font-redditsans-regular text-gray-500 mt-3 text-center px-6">
      Let us know when you typically end your day to optimize your habit tracking.
      </Text>

    </View>


        {/* PICKER */}
        <View
          className="relative flex-row justify-center"
          style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS }}
        >
          
          {/* HOURS */}
          <ScrollView
            ref={hourRef}
            onScroll={(e) => handleScroll(e, BASE_HOURS, setHour, hourRef)}
            scrollEventThrottle={16}
            snapToInterval={ITEM_HEIGHT}
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: CENTER_OFFSET,
              paddingBottom: CENTER_OFFSET,
            }}
            style={{ marginLeft:100 }}
          >
            {HOURS.map((h, i) => (
              <View key={i}>{renderItem(h, h === hour)}</View>
            ))}
          </ScrollView>

          {/* MINUTES */}
          <ScrollView
            ref={minuteRef}
            onScroll={(e) => handleScroll(e, BASE_MINUTES, setMinute, minuteRef)}
            scrollEventThrottle={16}
            snapToInterval={ITEM_HEIGHT}
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: CENTER_OFFSET,
              paddingBottom: CENTER_OFFSET,
            }}
            style={{marginRight:100 }}
          >
            {MINUTES.map((m, i) => (
              <View key={i}>{renderItem(m, m === minute)}</View>
            ))}
          </ScrollView>

          {/* PM */}
          <View
            style={{
              position: "absolute",
              right: 80,
              top: CENTER_OFFSET + ITEM_HEIGHT / 2 - 8,
            }}
          >
            <Text className="text-[14px] font-redditsans-bold text-gray-700">PM</Text>
          </View>
        </View>

        {/* BUTTON */}
        <TouchableOpacity onPress={() => {
          navigation.navigate("UserPref3", {
            preferences: {
              ...previousPreferences,
              endOfDayHour: hour,
              endOfDayMinute: minute,
            }
          });
        }} className="mt-36 bg-[#8bc37a] py-5 rounded-full">
          <Text className="text-white text-center font-redditsans-bold text-[16px]">
            Continue
          </Text>
        </TouchableOpacity>

        </SafeAreaView>
      </LinearGradient>
  );
};

export default UserPref2;
