import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import GrowDayLogo from "../../../assets/icons/growday-logo.svg";
import GoogleIcon from "../../../assets/icons/google-logo.svg";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEye, faEyeSlash, faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import { storage } from "../../utils/MMKVStore";
import { View } from "react-native";
import { loginfetch, getUserPreferencesFetch } from "../../utils/fetch";
import Toast from "../../components/common/Toast";



const Login = () => {
  const navigation = useNavigation();
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

        // Preferences-i əvvəlcə yoxla (token lazımdır, amma hələ navigate etmirik)
        let hasPrefs = false;
        try {
          const preferencesResponse = await getUserPreferencesFetch(token);
          hasPrefs = !!(preferencesResponse && preferencesResponse.data && !preferencesResponse.error);
        } catch (prefError) {
          console.log("Error checking user preferences:", prefError);
        }

        // 1. Əvvəlcə toast göstər
        showToast("Welcome back! 🌱", "success");

        // 2. Toast görünsün deye 1.1s gecikmə, sonra token yaz → Navigation özü keçər
        setTimeout(() => {
          storage.set("UsernameOrEmail", formData.UsernameOrEmail);
          storage.set("hasCompletedPreferences", hasPrefs);
          storage.set("accessToken", token); // ← bu NavigationContainer-i trigger edir
        }, 1100);
      } else {
        if (data.message === "Email not confirmed.") {
          navigation.navigate("OtpVerification", { email: formData.UsernameOrEmail });
        } else {
          const msgs = data.errors?.length > 0
            ? data.errors
            : [data.message || "Login failed. Please try again."];

          if (msgs.length === 1) {
            // Tək cümlə → toast ilə göstər
            showToast(msgs[0], "error");
          } else {
            // Çox xəta → inline bullet list
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

  return (
    <View style={{ flex: 1 }}>
      {/* Toast — bütün contentdən üstdə üzür */}
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
        <SafeAreaView className="flex-1">

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
          >

            {/* Logo */}
            <View className="items-center mt-4 mb-6">
              <GrowDayLogo width={140} height={140} />
            </View>

            {/* Title */}
            <Text className="text-white text-center text-4xl font-redditsans-bold mb-8">
              Welcome Back!
            </Text>

            {/* Google */}
            <TouchableOpacity className="flex-row justify-center bg-white rounded-full p-5 mb-6">
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
            />

            {/* Password */}
            <View className="relative">
              <TextInput
                placeholder="Password"
                placeholderTextColor="#aaa"
                secureTextEntry={!showPassword}
                onChangeText={(text) => handleInputChange("password", text)}
                className="bg-white rounded-xl p-4 mb-2 font-redditsans-medium text-black"
              />
              <TouchableOpacity 
                className="absolute right-4 top-4"
                onPress={() => setShowPassword(!showPassword)}
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
              className="mb-6"
            >
              <Text className="text-white text-right font-redditsans-medium">
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* Button */}
            <TouchableOpacity 
              className="bg-[#78C67E] p-4 rounded-full"
              onPress={handleLogin}
              disabled={loading}
              style={{ opacity: loading ? 0.75 : 1 }}
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
              <TouchableOpacity onPress={()=>navigation.navigate("Register")}>
                <Text className="text-white font-redditsans-bold"> Sign Up</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>

        </SafeAreaView>
      </KeyboardAvoidingView>
        </LinearGradient>
    </View>
  );
};

export default Login;
