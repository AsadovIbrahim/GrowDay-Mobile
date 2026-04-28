import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GrowDayLogo from "../../../assets/icons/growday-logo.svg";
import GoogleIcon from "../../../assets/icons/google-logo.svg";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEye, faEyeSlash, faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import { storage } from "../../utils/MMKVStore";
import { View } from "react-native";
import { loginfetch, getUserPreferencesFetch, googleLoginFetch } from "../../utils/fetch";
import Toast from "../../components/common/Toast";
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GOOGLE_WEB_CLIENT_ID } from '@env';

const Login = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverErrors, setServerErrors] = useState([]);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
  };

  const handleInputChange = (name, text) => {
    setFormData({ ...formData, [name]: text });
    setServerErrors([]);
    setToast({ visible: false, message: "", type: "error" });
  }

  const handleLogin = async () => {
    setLoading(true);
    setServerErrors([]);
    try {
      const data = await loginfetch(formData);
      if (data.success) {
        const token = data.data.accessToken.token;

        let hasPrefs = false;
        try {
          const preferencesResponse = await getUserPreferencesFetch(token);
          hasPrefs = !!(preferencesResponse && preferencesResponse.data && !preferencesResponse.error);
        } catch (prefError) {
          console.log("Error checking user preferences:", prefError);
        }

        showToast("Welcome back! 🌱", "success");

        setTimeout(() => {
          storage.set("UsernameOrEmail", formData.UsernameOrEmail);
          storage.set("hasCompletedPreferences", hasPrefs);
          storage.set("accessToken", token);
        }, 1100);
      } else {
        if (data.message === "Email not confirmed.") {
          navigation.navigate("OtpVerification", { email: formData.UsernameOrEmail });
        } else {
          const msgs = data.errors?.length > 0
            ? data.errors
            : [data.message || "Login failed. Please try again."];

          if (msgs.length === 1) {
            showToast(msgs[0], "error");
          } else {
            setServerErrors(msgs);
          }
        }
      }
    } catch (error) {
      showToast("Network error. Please check your connection.", "error");
    } finally {
      setLoading(false);
    }
  }

  const handleGoogleLogin = async () => {
    // 1. Configure GoogleSignin (requires Web Client ID)
    GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
    
    // 2. Perform login and get idToken
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      // In @react-native-google-signin/google-signin v14+, the structure is userInfo.data.idToken
      const idToken = userInfo?.data?.idToken || userInfo?.idToken;
      
      if (!idToken) {
         setLoading(false);
         // If it's cancelled, we can just return silently or show a message.
         if (userInfo?.type === 'cancelled') return;
         showToast("Google token not found.", "error");
         return;
      }
      
      setLoading(true);
      const data = await googleLoginFetch(idToken);
      console.log("SERVER RESPONSE FROM GOOGLE LOGIN:", data);
      
      if (data && data.success) {
        const token = data.data.accessToken.token;
        
        let hasPrefs = false;
        try {
          const preferencesResponse = await getUserPreferencesFetch(token);
          hasPrefs = !!(preferencesResponse && preferencesResponse.data && !preferencesResponse.error);
        } catch (prefError) {
          console.log("Error checking user preferences:", prefError);
        }

        showToast("Google login successful! 🌱", "success");

        setTimeout(() => {
          // For google login, we might not have a UsernameOrEmail in formData,
          // but we can set a flag or just the token and preferences.
          storage.set("hasCompletedPreferences", hasPrefs);
          storage.set("accessToken", token);
        }, 1100);
      } else {
        const errorMsg = data?.message || data?.title || "Google login failed on server";
        showToast(errorMsg, "error");
      }
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      showToast(error.message || "Google Sign-In failed.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
      />

      <LinearGradient
        colors={["#E9E6D7", "rgba(32,137,58,1)"]}
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
          >
            {/* Logo */}
            <View className="items-center mt-4">
              <GrowDayLogo width={100} height={100} />
            </View>

            {/* Title */}
            <Text className="text-white text-center text-3xl font-redditsans-bold mb-8">
              Welcome Back!
            </Text>

            {/* Google */}
            <TouchableOpacity 
              className="flex-row justify-center bg-white rounded-full p-3 mb-6"
              style={styles.googleButton}
              onPress={handleGoogleLogin}
            >
              <GoogleIcon width={22} height={22} />
              <Text className="text-black font-redditsans-medium text-lg ml-4">
                CONTINUE WITH GOOGLE
              </Text>
            </TouchableOpacity>

            <Text className="text-white text-center mb-6 font-redditsans-medium">
              OR LOG IN WITH EMAIL
            </Text>

            {/* Server Errors */}
            {serverErrors.length > 0 && (
              <View style={{
                backgroundColor: "rgba(255,107,107,0.15)",
                borderRadius: 12,
                padding: 14,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: "rgba(255,107,107,0.4)",
              }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: serverErrors.length > 1 ? 8 : 0 }}>
                  <FontAwesomeIcon icon={faCircleExclamation} size={15} color="#ff6b6b" />
                  <Text style={{ color: "#ff6b6b", fontFamily: "RedditSans-Bold", fontSize: 14, marginLeft: 8 }}>
                    {serverErrors.length === 1 ? serverErrors[0] : "Please fix the following:"}
                  </Text>
                </View>
                {serverErrors.length > 1 && serverErrors.map((err, i) => (
                  <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", marginTop: 4 }}>
                    <Text style={{ color: "#ff6b6b", fontSize: 13, marginRight: 6, marginTop: 2 }}>•</Text>
                    <Text style={{ color: "#ff6b6b", fontFamily: "RedditSans-Medium", fontSize: 13, flex: 1 }}>{err}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Email */}
            <TextInput
              placeholder="Email or Username"
              placeholderTextColor="#aaa"
              onChangeText={(text) => handleInputChange("UsernameOrEmail", text)}
              className="bg-white rounded-xl p-4 mb-4 font-redditsans-medium text-black"
              style={styles.modernInput}
            />

            {/* Password */}
            <View className="relative">
              <TextInput
                placeholder="Password"
                placeholderTextColor="#aaa"
                secureTextEntry={!showPassword}
                onChangeText={(text) => handleInputChange("password", text)}
                className="bg-white rounded-xl p-4 mb-2 font-redditsans-medium text-black"
                style={styles.modernInput}
              />
              <TouchableOpacity 
                className="absolute right-4 top-4"
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <FontAwesomeIcon 
                  icon={showPassword ? faEye : faEyeSlash} 
                  size={20} 
                  color="#999" 
                />
              </TouchableOpacity>
            </View>

            {/* Forgot */}
            <TouchableOpacity 
              onPress={()=>navigation.navigate("ForgotPassword")} 
              className="mb-6 mt-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text className="text-white text-right font-redditsans-medium">
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* Button */}
            <TouchableOpacity 
              className="bg-[#78C67E] p-3 rounded-full"
              onPress={handleLogin}
              disabled={loading}
              style={[styles.modernButton, { opacity: loading ? 0.75 : 1 }]}
              activeOpacity={0.8}
            >
              <Text className="text-white text-center font-redditsans-bold text-lg">
                {loading ? "Signing In..." : "Sign In"}
              </Text>
            </TouchableOpacity>

            {/* Register */}
            <View className="flex-row justify-center mt-6">
              <Text className="text-white font-redditsans-medium">
                Don’t have an account? 
              </Text>
              <TouchableOpacity onPress={()=>navigation.navigate("Register")} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text className="text-white font-redditsans-bold"> Sign Up</Text>
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
  },
  googleButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  }
});

export default Login;
