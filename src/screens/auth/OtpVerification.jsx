import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import GrowDayLogo from "../../../assets/icons/growday-logo.svg";
import { verifyOtpFetch } from "../../utils/fetch";

const OtpVerification = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { email } = route.params || {};
  const insets = useSafeAreaInsets();

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
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await verifyOtpFetch(email, otpCode);
      if (result.success) {
        navigation.navigate("Login");
      } else {
        setError(result.message || "Invalid verification code.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#E9E6D7", "rgba(32,137,58,1)"]}
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
              <FontAwesomeIcon icon={faArrowLeft} size={20} color="#3F414E" />
            </TouchableOpacity>

            <View className="items-center mb-6">
              <GrowDayLogo width={100} height={100} />
            </View>

            <Text className="text-white text-center text-4xl font-redditsans-bold mb-4">
              Verify Email
            </Text>
            
            <Text className="text-white text-center text-lg font-redditsans-regular mb-10 opacity-90">
              We've sent a 6-digit verification code to{"\n"}
              <Text className="font-redditsans-bold">{email}</Text>
            </Text>

            <View className="flex-row justify-between mb-8">
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  className="w-12 h-14 bg-white rounded-xl text-center text-2xl font-redditsans-bold text-black border-2 border-transparent focus:border-[#78C67E]"
                  style={styles.modernInput}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                />
              ))}
            </View>

            {error ? (
              <Text className="text-red-200 text-center font-redditsans-medium mb-6">
                {error}
              </Text>
            ) : null}

            <TouchableOpacity 
              className="bg-[#78C67E] p-3 rounded-full"
              style={[styles.modernButton, loading ? { opacity: 0.7 } : {}]}
              onPress={handleVerify}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="white" style={{ paddingVertical: 2 }} />
              ) : (
                <Text className="text-white text-center font-redditsans-bold text-lg">
                  Verify & Confirm
                </Text>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center mt-8">
              <Text className="text-white font-redditsans-regular">Didn't receive code? </Text>
              <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text className="text-white font-redditsans-bold">Resend</Text>
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
