import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import GrowDayLogo from "../../../assets/icons/growday-logo.svg";
import { verifyOtpFetch } from "../../utils/fetch";

const OtpVerification = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { email } = route.params || {};

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
    <LinearGradient
      colors={["#E9E6D7", "rgba(32,137,58,1)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1 w-full px-6">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mb-4">
          <FontAwesomeIcon icon={faArrowLeft} size={20} color="#3F414E" />
        </TouchableOpacity>

        <View className="items-center mb-8">
          <GrowDayLogo width={120} height={120} />
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
          className={`bg-[#78C67E] p-5 rounded-full ${loading ? 'opacity-70' : ''}`}
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-redditsans-bold text-lg">
              Verify & Confirm
            </Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center mt-8">
          <Text className="text-white font-redditsans-regular">Didn't receive code? </Text>
          <TouchableOpacity>
            <Text className="text-white font-redditsans-bold">Resend</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </LinearGradient>
  );
};

export default OtpVerification;
