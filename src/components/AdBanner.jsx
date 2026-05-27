import React, { useState } from "react";
import { View, Text } from "react-native";
import { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";

const AdBanner = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { colors } = theme;
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Dev mode is TestId.BANNER, prod is standard fallback test id or customer's ID
  const adUnitId = __DEV__ ? TestIds.BANNER : "ca-app-pub-8430015420939329/2836622339";

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
