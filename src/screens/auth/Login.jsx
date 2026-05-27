import { useNavigation } from "@react-navigation/native";
import { useState, useEffect } from "react";
import { Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Image } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GrowDayLogo from "../../../assets/images/main logo.png";
import GoogleIcon from "../../../assets/icons/google-logo.svg";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEye, faEyeSlash, faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import { storage, clearUserSession } from "../../utils/MMKVStore";
import { View } from "react-native";
import { loginfetch, getUserPreferencesFetch, googleLoginFetch } from "../../utils/fetch";
import { translateAuthError, translateAuthErrors } from "../../utils/translateAuthError";
import Toast from "../../components/common/Toast";
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GOOGLE_WEB_CLIENT_ID } from '@env';
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";

const Login = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverErrors, setServerErrors] = useState([]);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: false,
    });
  }, []);

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

        showToast(t("auth.messages.welcome_back_toast"), "success");

        setTimeout(() => {
          clearUserSession();
          storage.set("UsernameOrEmail", formData.UsernameOrEmail);
          storage.set("hasCompletedPreferences", hasPrefs);
          storage.set("accessToken", token);
        }, 1100);
      } else {
        if (data.message === "Email not confirmed.") {
          navigation.navigate("OtpVerification", { email: formData.UsernameOrEmail });
        } else {
          const msgs = data.errors?.length > 0
            ? translateAuthErrors(data.errors, t)
            : [translateAuthError(data.message, t) || t("auth.messages.login_failed")];

          if (msgs.length === 1) {
            showToast(msgs[0], "error");
          } else {
            setServerErrors(msgs);
          }
        }
      }
    } catch (error) {
      showToast(t("auth.messages.network_error"), "error");
    } finally {
      setLoading(false);
    }
  }


  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // 1. Ensure a fresh session to avoid stale tokens
      try {
        await GoogleSignin.hasPlayServices();
        await GoogleSignin.signOut();
      } catch (e) {
        // Sign out might fail if no user is signed in, which is fine
      }

      // 2. Perform login
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      const idToken = userInfo?.data?.idToken || userInfo?.idToken;
      
      if (!idToken) {
         setLoading(false);
         // If it's cancelled, we can just return silently or show a message.
         if (userInfo?.type === 'cancelled') return;
         showToast(t("auth.messages.google_token_not_found"), "error");
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

        showToast(t("auth.messages.google_success"), "success");

        setTimeout(() => {
          // For google login, we might not have a UsernameOrEmail in formData,
          // but we can set a flag or just the token and preferences.
          clearUserSession();
          storage.set("hasCompletedPreferences", hasPrefs);
          storage.set("accessToken", token);
        }, 1100);
      } else {
        const errorMsg = data?.message || data?.title || "Google login failed on server";
        showToast(errorMsg, "error");
      }
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      const clientPrefix = GOOGLE_WEB_CLIENT_ID ? GOOGLE_WEB_CLIENT_ID.substring(0, 15) : 'null';
      showToast(`${error.message || t("auth.messages.google_failed")} (ID: ${clientPrefix}...)`, "error");
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
        colors={colors.backgroundGradient}
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
            <View className="items-center mt-4 mb-2">
              <View style={{
                borderRadius: 24,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.25,
                shadowRadius: 12,
                elevation: 8,
                backgroundColor: '#000',
              }}>
                <Image source={GrowDayLogo} style={{ width: 100, height: 100, borderRadius: 24 }} resizeMode="cover" />
              </View>
            </View>

            {/* Title */}
            <Text className="text-center text-3xl font-redditsans-bold mb-8" style={{ color: colors.text }}>
              {t("auth.welcome_back")}
            </Text>

            {/* Google */}
            <TouchableOpacity 
              className="flex-row justify-center rounded-full p-3 mb-6"
              style={[styles.googleButton, { backgroundColor: colors.card }]}
              onPress={handleGoogleLogin}
            >
              <GoogleIcon width={22} height={22} />
              <Text className="font-redditsans-medium text-lg ml-4" style={{ color: colors.text }}>
                {t("auth.google_continue")}
              </Text>
            </TouchableOpacity>

            <Text className="text-center mb-6 font-redditsans-medium" style={{ color: colors.textSecondary }}>
              {t("auth.or_login_email")}
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
                    {serverErrors.length === 1 ? serverErrors[0] : t("auth.messages.fix_following")}
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
              placeholder={t("auth.email_username")}
              placeholderTextColor={colors.textSecondary}
              onChangeText={(text) => handleInputChange("UsernameOrEmail", text)}
              className="rounded-xl p-4 mb-4 font-redditsans-medium"
              style={[styles.modernInput, { backgroundColor: colors.card, color: colors.text }]}
            />

            {/* Password */}
            <View className="relative">
              <TextInput
                placeholder={t("auth.password")}
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showPassword}
                onChangeText={(text) => handleInputChange("password", text)}
                className="rounded-xl p-4 mb-2 font-redditsans-medium"
                style={[styles.modernInput, { backgroundColor: colors.card, color: colors.text }]}
              />
              <TouchableOpacity 
                className="absolute right-4 top-4"
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <FontAwesomeIcon 
                  icon={showPassword ? faEye : faEyeSlash} 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>

            {/* Forgot */}
            <TouchableOpacity 
              onPress={()=>navigation.navigate("ForgotPassword")} 
              className="mb-6 mt-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text className="text-right font-redditsans-medium" style={{ color: colors.textSecondary }}>
                {t("auth.forgot_password_link")}
              </Text>
            </TouchableOpacity>

            {/* Button */}
            <TouchableOpacity 
              className="p-3 rounded-full"
              onPress={handleLogin}
              disabled={loading}
              style={[styles.modernButton, { backgroundColor: colors.primary, opacity: loading ? 0.75 : 1 }]}
              activeOpacity={0.8}
            >
              <Text className="text-white text-center font-redditsans-bold text-lg">
                {loading ? t("auth.signing_in") : t("auth.sign_in")}
              </Text>
            </TouchableOpacity>

            {/* Register */}
            <View className="flex-row justify-center mt-6">
              <Text className="font-redditsans-medium" style={{ color: colors.textSecondary }}>
                {t("auth.no_account")} 
              </Text>
              <TouchableOpacity onPress={()=>navigation.navigate("Register")} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text className="font-redditsans-bold" style={{ color: colors.primary }}> {t("auth.sign_up")}</Text>
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
