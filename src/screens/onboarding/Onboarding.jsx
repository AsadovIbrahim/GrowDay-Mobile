import React, { useState, useCallback } from "react";
import { View, Text, FlatList, Dimensions, StyleSheet, Modal, TouchableWithoutFeedback, ScrollView } from "react-native";
import { TouchableOpacity } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";
import Onboarding1 from "../../../assets/images/Onboarding1.svg";
import Onboarding2 from "../../../assets/images/Onboarding2.svg";
import Onboarding3 from "../../../assets/images/Onboarding3.svg";
import { useNavigation } from "@react-navigation/native";
import { storage } from "../../utils/MMKVStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get("window");

const LANGUAGES = [
  { code: "az", flag: "🇦🇿", label: "AZ", native: "Azərbaycan" },
  { code: "en", flag: "🇬🇧", label: "EN", native: "English" },
  { code: "tr", flag: "🇹🇷", label: "TR", native: "Türkçe" },
  { code: "ru", flag: "🇷🇺", label: "RU", native: "Русский" },
  { code: "de", flag: "🇩🇪", label: "DE", native: "Deutsch" },
  { code: "fr", flag: "🇫🇷", label: "FR", native: "Français" },
  { code: "es", flag: "🇪🇸", label: "ES", native: "Español" },
  { code: "it", flag: "🇮🇹", label: "IT", native: "Italiano" },
  { code: "ar", flag: "🇸🇦", label: "AR", native: "العربية" },
  { code: "zh", flag: "🇨🇳", label: "ZH", native: "中文" },
];

export default function Onboarding() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [langModalVisible, setLangModalVisible] = useState(false);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();

  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  const selectLanguage = (code) => {
    i18n.changeLanguage(code);
    storage.set("userLanguage", code);
    setLangModalVisible(false);
  };

  const data = [
    { title: t("onboarding.slide1_title"), description: t("onboarding.slide1_desc"), image: Onboarding1 },
    { title: t("onboarding.slide2_title"), description: t("onboarding.slide2_desc"), image: Onboarding2 },
    { title: t("onboarding.slide3_title"), description: t("onboarding.slide3_desc"), image: Onboarding3 },
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
      transform: [{ translateY: withTiming(isLast ? 0 : 30, { duration: 300 }) }],
    };
  });

  return (
    <LinearGradient
      colors={["#E9E6D7", "rgba(32, 137, 58, 1)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <View className="flex-1">

        {/* Language Button */}
        <TouchableOpacity
          onPress={() => setLangModalVisible(true)}
          activeOpacity={0.8}
          style={{
            position: "absolute",
            right: 20,
            top: insets.top + 10,
            zIndex: 10,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: "rgba(255,255,255,0.22)",
            borderRadius: 999,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.4)",
          }}
        >
          <Text style={{ fontSize: 16 }}>{currentLang.flag}</Text>
          <Text style={{ fontFamily: "RedditSans-Bold", fontSize: 13, color: "#fff" }}>
            {currentLang.label}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, marginLeft: -2 }}>▾</Text>
        </TouchableOpacity>

        {/* Language Modal */}
        <Modal
          visible={langModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setLangModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setLangModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalSheet}>
                  {/* Handle */}
                  <View style={styles.handle} />

                  <Text style={styles.modalTitle}>Select Language</Text>

                  <ScrollView showsVerticalScrollIndicator={false}>
                    {LANGUAGES.map((lang, i) => {
                      const isActive = lang.code === i18n.language;
                      return (
                        <TouchableOpacity
                          key={lang.code}
                          onPress={() => selectLanguage(lang.code)}
                          activeOpacity={0.7}
                          style={[
                            styles.langRow,
                            i < LANGUAGES.length - 1 && styles.langRowBorder,
                            isActive && styles.langRowActive,
                          ]}
                        >
                          <Text style={styles.langFlag}>{lang.flag}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.langNative, isActive && { color: "#2d8a3a" }]}>
                              {lang.native}
                            </Text>
                            <Text style={styles.langCode}>{lang.label}</Text>
                          </View>
                          {isActive && (
                            <View style={styles.activeCheck}>
                              <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>✓</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        <FlatList
          data={data}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={{ width, paddingTop: insets.top + 40 }} className="px-10">
              <View className="w-full items-center mb-6">
                {item.image && <item.image height={300} />}
              </View>
              <View className="w-full pl-5 gap-5">
                <Text className="text-5xl font-redditsans-bold text-white capitalize">
                  {item.title}
                </Text>
                <Text className="text-lg font-redditsans-regular text-white mt-3">
                  {item.description}
                </Text>
              </View>
            </View>
          )}
        />

        <View
          className="gap-5"
          style={[styles.dotContainer, { marginBottom: insets.bottom + 100 }]}
        >
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
          style={[animatedButton, { paddingBottom: insets.bottom + 10 }]}
          className="p-5 absolute bottom-0 left-0 right-0"
        >
          <TouchableOpacity
            className="bg-[#83BB7B] p-5 rounded-full"
            onPress={() => {
              storage.set("isOnBoardingShown", true);
              navigation.navigate("Login");
            }}
          >
            <Text className="text-center text-white text-2xl font-redditsans-bold">
              {t("onboarding.get_started")}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  dotContainer: { flexDirection: "row", justifyContent: "center" },
  dot: { width: 10, height: 10, borderRadius: 6, marginHorizontal: 5 },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
    maxHeight: "70%",
  },
  handle: {
    width: 40, height: 4,
    backgroundColor: "#e0e0e0",
    borderRadius: 999,
    alignSelf: "center",
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: "RedditSans-Bold",
    color: "#111",
    marginBottom: 16,
    textAlign: "center",
  },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 4,
    gap: 14,
    borderRadius: 12,
  },
  langRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ebebeb",
  },
  langRowActive: {
    backgroundColor: "rgba(45,138,58,0.07)",
  },
  langFlag: { fontSize: 26 },
  langNative: {
    fontSize: 15,
    fontFamily: "RedditSans-Medium",
    color: "#111",
  },
  langCode: {
    fontSize: 11,
    fontFamily: "RedditSans-Regular",
    color: "#888",
    marginTop: 1,
  },
  activeCheck: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: "#2d8a3a",
    alignItems: "center", justifyContent: "center",
  },
});
