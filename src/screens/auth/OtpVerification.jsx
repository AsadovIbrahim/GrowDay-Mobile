import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import GrowDayLogo from "../../../assets/icons/growday-logo.svg";
import { verifyOtpFetch } from "../../utils/fetch";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";

const OtpVerification = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { email } = route.params || {};
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef([]);

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join("");
    if (otpCode.length < 6) {
      setError(t("auth.messages.otp_complete_error"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await verifyOtpFetch(email, otpCode);
      if (result.success) {
        navigation.navigate("Login");
      } else {
        setError(result.message || t("auth.messages.invalid_otp"));
      }
    } catch (err) {
      setError(t("auth.messages.something_wrong"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={colors.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="flex-1"
      >
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ 
              paddingHorizontal: 24, 
              paddingTop: insets.top + 20, 
              paddingBottom: insets.bottom + 60,
              flexGrow: 1,
              justifyContent: 'center'
            }}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} style={{ alignSelf: 'flex-start', marginBottom: 16 }}>
              <FontAwesomeIcon icon={faArrowLeft} size={20} color={colors.text} />
            </TouchableOpacity>

            <View className="items-center mb-6">
              <GrowDayLogo width={100} height={100} />
            </View>

            <Text className="text-center text-4xl font-redditsans-bold mb-4" style={{ color: colors.text }}>
              {t("auth.verify_email")}
            </Text>
            
            <Text className="text-center text-lg font-redditsans-regular mb-10 opacity-90" style={{ color: colors.textSecondary }}>
              {t("auth.otp_sent_desc")}{"\n"}
              <Text className="font-redditsans-bold" style={{ color: colors.text }}>{email}</Text>
            </Text>

            <View className="flex-row justify-between mb-8">
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  className="w-12 h-14 rounded-xl text-center text-2xl font-redditsans-bold border-2"
                  style={[styles.modernInput, { backgroundColor: colors.card, color: colors.text, borderColor: digit ? colors.primary : 'transparent' }]}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                />
              ))}
            </View>

            {error ? (
              <Text className="text-red-400 text-center font-redditsans-medium mb-6">
                {error}
              </Text>
            ) : null}

            <TouchableOpacity 
              className="p-3 rounded-full"
              style={[styles.modernButton, { backgroundColor: colors.primary }, loading ? { opacity: 0.7 } : {}]}
              onPress={handleVerify}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="white" style={{ paddingVertical: 2 }} />
              ) : (
                <Text className="text-white text-center font-redditsans-bold text-lg">
                  {t("auth.verify_confirm")}
                </Text>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center mt-8">
              <Text className="font-redditsans-regular" style={{ color: colors.textSecondary }}>{t("auth.didnt_receive")} </Text>
              <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text className="font-redditsans-bold" style={{ color: colors.primary }}>{t("auth.resend")}</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  modernInput: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modernButton: {
    shadowColor: "#78C67E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  }
});

export default OtpVerification;
