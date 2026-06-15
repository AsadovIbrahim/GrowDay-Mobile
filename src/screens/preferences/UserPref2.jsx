import React, { useRef, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowLeft, faSun } from "@fortawesome/free-solid-svg-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";

const ITEM_HEIGHT = 64;
const VISIBLE_ITEMS = 5;
const CENTER_OFFSET = Math.floor(VISIBLE_ITEMS / 2) * ITEM_HEIGHT;

const BASE_HOURS = [...Array(24).keys()];
const BASE_MINUTES = [...Array(60).keys()];

const HOURS = [...BASE_HOURS, ...BASE_HOURS, ...BASE_HOURS];
const MINUTES = [...BASE_MINUTES, ...BASE_MINUTES, ...BASE_MINUTES];

const UserPref2 = () => {
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const route = useRoute();
  const initialData = route.params?.initialData;
  const isUpdate = route.params?.isUpdate;

  const hourRef = useRef(null);
  const minuteRef = useRef(null);

  const [hour, setHour] = useState(7);
  const [minute, setMinute] = useState(0);
  const [hourIndex, setHourIndex] = useState(BASE_HOURS.length + 7);
  const [minuteIndex, setMinuteIndex] = useState(BASE_MINUTES.length);
  const navigation = useNavigation();

  useEffect(() => {
    let startHour = 7;
    let startMinute = 0;

    if (initialData?.wakeUpTime) {
      const parts = initialData.wakeUpTime.split(":");
      startHour = parseInt(parts[0]);
      startMinute = parseInt(parts[1]);
      setHour(startHour);
      setMinute(startMinute);
    }

    setTimeout(() => {
      const hourIdx = BASE_HOURS.indexOf(startHour);
      const minuteIdx = BASE_MINUTES.indexOf(startMinute);
      
      const initialHourIndex = hourIdx + BASE_HOURS.length;
      const initialMinuteIndex = minuteIdx + BASE_MINUTES.length;

      setHourIndex(initialHourIndex);
      setMinuteIndex(initialMinuteIndex);

      hourRef.current?.scrollTo({
        y: initialHourIndex * ITEM_HEIGHT,
        animated: false,
      });

      minuteRef.current?.scrollTo({
        y: initialMinuteIndex * ITEM_HEIGHT,
        animated: false,
      });
    }, 50);
  }, []);

  useEffect(() => {
    console.log("hour", hour);
    console.log("minute", minute);
  }, [hour, minute]);

  const previousPreferences = route.params?.preferences || {};

  const handleScroll = (event, base, setter, setIndex, ref) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);

    setIndex(index);

    const actual = index % base.length;
    setter(base[actual]);

    if (index < base.length || index >= base.length * 2) {
      const newIndex = actual + base.length;
      setIndex(newIndex);
      ref.current?.scrollTo({
        y: newIndex * ITEM_HEIGHT,
        animated: false,
      });
    }
  };

  const renderItem = (value, selected) => (
    <View style={{ height: ITEM_HEIGHT }} className="items-center justify-center">
      <Text
        style={{
          fontSize: selected ? 36 : 20,
          fontWeight: selected ? "800" : "500",
          color: selected ? (isDark ? "#ffffff" : "#1f2937") : (isDark ? "rgba(255,255,255,0.35)" : "rgba(31,41,55,0.35)"),
          includeFontPadding: false,
          textAlignVertical: "center",
          letterSpacing: selected ? 1 : 0,
        }}
        className={selected ? "font-redditsans-bold" : "font-redditsans-regular"}
      >
        {String(value).padStart(2, "0")}
      </Text>
    </View>
  );

  return (
    <LinearGradient colors={isDark ? ["#0a0f0b", "#1a2e1c"] : ["#e7f0df", "#2f6f3f"]} className="flex-1 px-6">
      <SafeAreaView className="flex-1">

        {/* HEADER */}
        <View className="flex-row items-center mt-6 mb-10">
          <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 items-center justify-center rounded-full bg-black/5">
            <FontAwesomeIcon icon={faArrowLeft} size={18} color={isDark ? "#ffffff" : "#1f2937"} />
          </TouchableOpacity>

          <View className="flex-1 h-2 bg-black/10 rounded-full mx-4">
            <View className="w-[37.5%] h-full bg-green-500 rounded-full" />
          </View>

          <Text style={{ color: colors.textSecondary }} className="font-bold font-redditsans-bold text-lg">3/8</Text>
        </View>

        <View className="items-center mb-12">
          <Text style={{ color: colors.text }} className="text-3xl font-redditsans-bold text-center leading-tight">
            {t("preferences.step2.title1")}
          </Text>
          <View className="flex-row items-center justify-center mt-2">
            <Text className="text-3xl font-redditsans-bold text-green-500">
              {t("preferences.step2.title2")}
            </Text>
            <FontAwesomeIcon
              icon={faSun}
              size={28}
              color="#FFD43B"
              style={{ marginLeft: 8, marginBottom: -4 }}
            />
          </View>
          <Text style={{ color: isDark ? "rgba(255,255,255,0.7)" : "#6b7280" }} className="text-base font-redditsans-regular mt-4 text-center leading-relaxed">
            {t("preferences.step2.subtitle")}
          </Text>
        </View>

        {/* PICKER CONTAINER */}
        <View className="items-center mb-12">
          <View
            className="relative flex-row justify-center items-center rounded-3xl overflow-hidden"
            style={{ 
              height: ITEM_HEIGHT * VISIBLE_ITEMS,
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
              width: '100%',
              maxWidth: 280,
             
            }}
          >
            {/* CENTER INDICATOR */}
            <View
              className="absolute z-10"
              style={{
                top: CENTER_OFFSET,
                height: ITEM_HEIGHT,
                width: '85%',
                borderTopWidth: 2,
                borderBottomWidth: 2,
                borderColor: '#22c55e',
                borderRadius: 16,
              }}
            />

            {/* COLON SEPARATOR */}
            <View className="absolute z-20" style={{ top: CENTER_OFFSET + (ITEM_HEIGHT / 2) - 17 }}>
              <Text className="text-3xl font-bold" style={{ color: isDark ? "#ffffff" : "#1f2937" }}>:</Text>
            </View>

            {/* HOURS */}
            <ScrollView
              ref={hourRef}
              onScroll={(e) => handleScroll(e, BASE_HOURS, setHour, setHourIndex, hourRef)}
              scrollEventThrottle={16}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingTop: CENTER_OFFSET,
                paddingBottom: CENTER_OFFSET,
              }}
              style={{ width: 120 }}
            >
              {HOURS.map((h, i) => (
                <View key={i}>{renderItem(h, i === hourIndex)}</View>
              ))}
            </ScrollView>

            {/* MINUTES */}
            <ScrollView
              ref={minuteRef}
              onScroll={(e) => handleScroll(e, BASE_MINUTES, setMinute, setMinuteIndex, minuteRef)}
              scrollEventThrottle={16}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingTop: CENTER_OFFSET,
                paddingBottom: CENTER_OFFSET,
              }}
              style={{ width: 120 }}
            >
              {MINUTES.map((m, i) => (
                <View key={i}>{renderItem(m, i === minuteIndex)}</View>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* BUTTON */}
        <TouchableOpacity 
          onPress={() => {
            navigation.navigate("UserPref3", {
              isUpdate,
              initialData,
              preferences: {
                ...previousPreferences,
                wakeUpHour: hour,
                wakeUpMinute: minute,
              }
            });
          }} 
          style={{ backgroundColor: colors.primaryLight, shadowColor: isDark ? colors.primary : "rgba(0,0,0,0.15)", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 }} 
          className="mt-auto py-5 rounded-full mb-6"
        >
          <Text className="text-white text-center font-redditsans-bold text-lg">
            {t("preferences.continue")}
          </Text>
        </TouchableOpacity>

      </SafeAreaView>
    </LinearGradient>
  );
};

export default UserPref2;
