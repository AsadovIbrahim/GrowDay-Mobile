import React, { useRef, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowLeft, faMoon } from "@fortawesome/free-solid-svg-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

const ITEM_HEIGHT = 56;
const VISIBLE_ITEMS = 5;
const CENTER_OFFSET = Math.floor(VISIBLE_ITEMS / 2) * ITEM_HEIGHT;

const BASE_HOURS = [...Array(24).keys()];
const BASE_MINUTES = [...Array(60).keys()];

const HOURS = [...BASE_HOURS, ...BASE_HOURS, ...BASE_HOURS];
const MINUTES = [...BASE_MINUTES, ...BASE_MINUTES, ...BASE_MINUTES];

const UserPref3 = () => {
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const hourRef = useRef(null);
  const minuteRef = useRef(null);
  const route = useRoute();
  const navigation = useNavigation();

  const initialData = route.params?.initialData;
  const isUpdate = route.params?.isUpdate;

  const [hour, setHour] = useState(21); 
  const [minute, setMinute] = useState(0);
  
  // Get preferences from previous screen
  const previousPreferences = route.params?.preferences || {};

  useEffect(() => {
    let startHour = 21;
    let startMinute = 0;

    if (initialData?.sleepTime) {
      const parts = initialData.sleepTime.split(":");
      startHour = parseInt(parts[0]);
      startMinute = parseInt(parts[1]);
      setHour(startHour);
      setMinute(startMinute);
    }

    setTimeout(() => {
      const hourIndex = BASE_HOURS.indexOf(startHour);
      const minuteIndex = BASE_MINUTES.indexOf(startMinute);
      hourRef.current?.scrollTo({ y: (hourIndex + BASE_HOURS.length) * ITEM_HEIGHT, animated: false });
      minuteRef.current?.scrollTo({ y: (minuteIndex + BASE_MINUTES.length) * ITEM_HEIGHT, animated: false });
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
          color: selected ? (isDark ? "#ffffff" : "#1f2937") : (isDark ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.6)"),
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
      <LinearGradient colors={isDark ? ["#0a0f0b", "#1a2e1c"] : ["#e7f0df", "#2f6f3f"]} className="flex-1 px-5">
        <SafeAreaView className="flex-1">

        {/* HEADER */}
        <View className="flex-row items-center mt-4 mb-8">
          <TouchableOpacity onPress={handleGoBack}>
            <FontAwesomeIcon  icon={faArrowLeft} size={20} color={isDark ? "#ffffff" : "#1f2937"}/>
          </TouchableOpacity>

          <View className="flex-1 h-2 bg-black/10 rounded-full mx-4">
            <View className="w-[50%] h-full bg-green-500 rounded-full" />
          </View>

          <Text style={{ color: isDark ? "#ffffff" : "#1f2937" }} className="font-semibold font-redditsans-bold">4/8</Text>
        </View>

        <View className="items-center mb-10">
          <Text style={{ color: isDark ? "#ffffff" : "#1f2937" }} className="text-[26px] font-redditsans-bold text-center">
            {t("preferences.step3.title1")}
          </Text>
          <View className="flex-row items-center justify-center">
            <Text className="text-[26px] font-redditsans-bold text-green-500">
              {t("preferences.step3.title2")}
            </Text>
            <FontAwesomeIcon
              icon={faMoon}
              size={20}
              color="#FFD43B"
              style={{ marginLeft: 6 , marginBottom: -6 }}
            />
          </View>
          <Text style={{ color: isDark ? "rgba(255,255,255,0.6)" : "#6b7280" }} className="text-[13px] font-redditsans-regular mt-3 text-center px-6">
            {t("preferences.step3.subtitle")}
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
        </View>

        {/* BUTTON */}
        <TouchableOpacity onPress={() => {
          navigation.navigate("UserPref4", {
            isUpdate,
            initialData,
            preferences: {
              ...previousPreferences,
              endOfDayHour: hour,
              endOfDayMinute: minute,
            }
          });
        }} className="mt-36 bg-[#8bc37a] py-5 rounded-full">
          <Text className="text-white text-center font-redditsans-bold text-[16px]">
            {t("preferences.continue")}
          </Text>
        </TouchableOpacity>

        </SafeAreaView>
      </LinearGradient>
  );
};

export default UserPref3;
