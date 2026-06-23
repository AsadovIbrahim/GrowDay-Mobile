import { useNavigation } from "@react-navigation/native";
import { useState, useEffect, useRef } from "react";
import { Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Image } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GrowDayLogo from "../../../assets/images/main logo.png";
import GoogleIcon from "../../../assets/icons/google-logo.svg";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEye, faEyeSlash, faCircleExclamation, faEnvelope, faLock, faUser } from '@fortawesome/free-solid-svg-icons';
import { storage, clearUserSession, getStorageScope } from "../../utils/MMKVStore";
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
  const [focusedInput, setFocusedInput] = useState(null);

  const scrollViewRef = useRef(null);
  const usernameOrEmailRef = useRef(null);
  const passwordRef = useRef(null);

  const scrollToInput = (ref) => {
    setTimeout(() => {
      ref?.current?.measureInWindow((x, y) => {
        scrollViewRef.current?.scrollTo({ y: y - 120, animated: true });
      });
    }, 100);
  };

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
          // Set stable user scope BEFORE setting the token so chat history keys resolve correctly
          const scope = formData.UsernameOrEmail.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16) || 'user';
          storage.set('userScope', scope);
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

        // Extract email from Google user info for stable chat history scoping
        const googleEmail = userInfo?.data?.user?.email || userInfo?.user?.email || '';

        setTimeout(() => {
          clearUserSession();
          if (googleEmail) {
            storage.set("UsernameOrEmail", googleEmail);
            const scope = googleEmail.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16) || 'user';
            storage.set('userScope', scope);
          }
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
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
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
                borderRadius: 28,
                padding: 4,
                backgroundColor: colors.card,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.12,
                shadowRadius: 15,
                elevation: 8,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
                <Image source={GrowDayLogo} style={{ width: 90, height: 90, borderRadius: 24 }} resizeMode="cover" />
              </View>
            </View>

            {/* Title */}
            <Text className="text-center text-3xl font-redditsans-bold mt-2 mb-1" style={{ color: colors.text }}>
              {t("auth.welcome_back")}
            </Text>
            <Text className="text-center text-sm font-redditsans-medium mb-8" style={{ color: colors.textSecondary }}>
              {t("auth.welcome_subtitle", "Sign in to your account to continue your growth")}
            </Text>

            {/* Google */}
            <TouchableOpacity
              className="flex-row justify-center items-center rounded-2xl py-3.5 mb-6 border"
              style={[styles.googleButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleGoogleLogin}
            >
              <GoogleIcon width={20} height={20} />
              <Text className="font-redditsans-bold text-base ml-3" style={{ color: colors.text }}>
                {t("auth.google_continue")}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-[1.5px]" style={{ backgroundColor: colors.border, opacity: 0.8 }} />
              <Text className="mx-4 text-xs font-redditsans-bold uppercase tracking-wider" style={{ color: colors.textSecondary, opacity: 0.7 }}>
                {t("auth.or_login_email")}
              </Text>
              <View className="flex-1 h-[1.5px]" style={{ backgroundColor: colors.border, opacity: 0.8 }} />
            </View>

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
            <View
              className="flex-row items-center rounded-2xl px-4 mb-4 border"
              style={{
                backgroundColor: colors.card,
                borderColor: focusedInput === 'UsernameOrEmail' ? colors.primary : colors.border,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: focusedInput === 'UsernameOrEmail' ? 6 : 1 },
                shadowOpacity: focusedInput === 'UsernameOrEmail' ? 0.12 : 0.02,
                shadowRadius: focusedInput === 'UsernameOrEmail' ? 8 : 2,
                elevation: focusedInput === 'UsernameOrEmail' ? 4 : 1,
              }}
            >
              <View style={{ width: 24, alignItems: 'center' }}>
                <FontAwesomeIcon
                  icon={faUser}
                  color={focusedInput === 'UsernameOrEmail' ? colors.primary : colors.textSecondary}
                  size={18}
                />
              </View>
              <TextInput
                ref={usernameOrEmailRef}
                placeholder={t("auth.email_username")}
                placeholderTextColor={colors.textSecondary}
                onChangeText={(text) => handleInputChange("UsernameOrEmail", text)}
                onFocus={() => { setFocusedInput('UsernameOrEmail'); scrollToInput(usernameOrEmailRef); }}
                onBlur={() => setFocusedInput(null)}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                className="flex-1 py-3.5 pl-3 font-redditsans-medium text-base"
                style={{ color: colors.text }}
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
            <View
              className="flex-row items-center rounded-2xl px-4 mb-3 border"
              style={{
                backgroundColor: colors.card,
                borderColor: focusedInput === 'password' ? colors.primary : colors.border,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: focusedInput === 'password' ? 6 : 1 },
                shadowOpacity: focusedInput === 'password' ? 0.12 : 0.02,
                shadowRadius: focusedInput === 'password' ? 8 : 2,
                elevation: focusedInput === 'password' ? 4 : 1,
              }}
            >
              <View style={{ width: 24, alignItems: 'center' }}>
                <FontAwesomeIcon
                  icon={faLock}
                  color={focusedInput === 'password' ? colors.primary : colors.textSecondary}
                  size={18}
                />
              </View>
              <TextInput
                ref={passwordRef}
                placeholder={t("auth.password")}
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showPassword}
                onChangeText={(text) => handleInputChange("password", text)}
                onFocus={() => { setFocusedInput('password'); scrollToInput(passwordRef); }}
                onBlur={() => setFocusedInput(null)}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                className="flex-1 py-3.5 pl-3 pr-10 font-redditsans-medium text-base"
                style={{ color: colors.text }}
                autoCapitalize="none"
              />
              <TouchableOpacity
                className="absolute right-4"
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <FontAwesomeIcon
                  icon={showPassword ? faEye : faEyeSlash}
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Forgot */}
            <TouchableOpacity
              onPress={() => navigation.navigate("ForgotPassword")}
              className="mb-6 mt-1"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text className="text-right font-redditsans-bold text-sm" style={{ color: colors.primary }}>
                {t("auth.forgot_password_link")}
              </Text>
            </TouchableOpacity>

            {/* Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.primaryLight || '#4caf66', colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-3.5"
                style={[styles.modernButton, { opacity: loading ? 0.75 : 1 }]}
              >
                <Text className="text-white text-center font-redditsans-bold text-lg">
                  {loading ? t("auth.signing_in") : t("auth.sign_in")}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Register */}
            <View className="flex-row justify-center mt-6">
              <Text className="font-redditsans-medium" style={{ color: colors.textSecondary }}>
                {t("auth.no_account")}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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
  modernButton: {
    borderRadius: 20,
    shadowColor: "#2f6f3f",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  googleButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  }
});

export default Login;
