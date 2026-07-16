import React, { useState } from "react";
import { View, Text, Platform } from "react-native";
import { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";

const AdBanner = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { colors } = theme;
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Dev mode uses TestId.BANNER, prod splits between iOS and Android
  const adUnitId = __DEV__
    ? TestIds.BANNER
    : Platform.OS === "ios"
      ? TestIds.BANNER // iOS Banner Ad Unit ID (using Test ID for now)
      : "ca-app-pub-3252694717568082/4135981271"; // Android Banner Ad Unit ID

  if (error) {
    return null; // Keep UI clean if loading fails
  }

  return (
    <View 
      className="my-4 items-center justify-center rounded-2xl overflow-hidden py-1"
      style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        marginHorizontal: 16,
      }}
    >
      {!loaded && (
        <View className="py-3 items-center justify-center">
          <Text style={{ color: colors.textSecondary }} className="text-xs font-redditsans-medium">
            {t("common.ad_loading")}
          </Text>
        </View>
      )}
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => setLoaded(true)}
        onAdFailedToLoad={(err) => {
          console.log("Ad banner failed to load:", err);
          setError(true);
        }}
      />
    </View>
  );
};

export default AdBanner;
