import { View, Text, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Image } from "react-native";
import { useState, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GrowDayLogo from "../../../assets/images/main logo.png";
import GoogleIcon from "../../../assets/icons/google-logo.svg";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEye, faEyeSlash, faArrowLeft, faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GOOGLE_WEB_CLIENT_ID } from '@env';
import { registerfetch, googleLoginFetch, getUserPreferencesFetch } from "../../utils/fetch";
import { storage } from "../../utils/MMKVStore";
import Toast from "../../components/common/Toast";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";

const Register = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const { colors } = theme;
    const { t } = useTranslation();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [serverErrors, setServerErrors] = useState([]);
    const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

    const scrollViewRef = useRef(null);
    const firstNameRef = useRef(null);
    const lastNameRef = useRef(null);
    const usernameRef = useRef(null);
    const emailRef = useRef(null);
    const passwordRef = useRef(null);
    const confirmPasswordRef = useRef(null);

    const scrollToInput = (ref) => {
      setTimeout(() => {
        ref?.current?.measureInWindow((x, y) => {
          scrollViewRef.current?.scrollTo({ y: y - 120, animated: true });
        });
      }, 100);
    };

    const showToast = (message, type = "success") => {
      setToast({ visible: true, message, type });
    };
  
    const handleInputChange = (name, text) => {
      setFormData({ ...formData, [name]: text });
      setServerErrors([]);
    }
    const translateServerError = (err) => {
      const errorMap = {
        "Username is already in use.": t("auth.messages.username_taken"),
        "Email is already in use.": t("auth.messages.email_taken"),
        "Passwords must have at least one non alphanumeric character.": t("auth.validation.password_non_alphanumeric"),
        "Passwords must have at least one uppercase ('A'-'Z').": t("auth.validation.password_uppercase"),
        "Passwords must have at least one lowercase ('a'-'z').": t("auth.validation.password_lowercase"),
        "Passwords must have at least one digit ('0'-'9').": t("auth.validation.password_digit"),
        "Passwords must be at least 8 characters.": t("auth.validation.password_min_length"),
        "Passwords must have at least one special character.": t("auth.validation.password_non_alphanumeric"),
        "Passwords do not match.": t("auth.messages.passwords_dont_match"),
        "Invalid email address.": t("auth.validation.invalid_email"),
      };
      return errorMap[err] || err;
    };

    const handleRegister = async () => {
      setLoading(true);
      setServerErrors([]);
      try {
        const data = await registerfetch(formData);
        if (data.success) {
          storage.set("firstName", formData.firstname);
          storage.set("lastName", formData.lastname);
          storage.set("username", formData.username);
          storage.set("email", formData.email);
          storage.set("hasCompletedPreferences", false);
          navigation.navigate("OtpVerification", { email: formData.email });
        } else {
          const msgs = data.errors?.length > 0
            ? data.errors.map(err => translateServerError(err))
            : [translateServerError(data.message) || t("auth.messages.registration_failed")];
          setServerErrors(msgs);
        }
      } catch (error) {
        setServerErrors([t("auth.messages.network_error")]);
      } finally {
        setLoading(false);
      }
    }

    const handleGoBack = () => {
      navigation.goBack();
    }

    const handleGoogleLogin = async () => {
      // 1. Configure GoogleSignin
      GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
      
      try {
        await GoogleSignin.hasPlayServices();
        const userInfo = await GoogleSignin.signIn();
        
        // In @react-native-google-signin/google-signin v14+, the structure is userInfo.data.idToken
        const idToken = userInfo?.data?.idToken || userInfo?.idToken;
        
        if (!idToken) {
           setLoading(false);
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
  
          showToast(t("auth.messages.google_signup_success"), "success");
  
          setTimeout(() => {
            storage.set("hasCompletedPreferences", hasPrefs);
            storage.set("accessToken", token);
          }, 1100);
        } else {
          const errorMsg = data?.message || data?.title || t("auth.messages.google_signup_failed");
          showToast(errorMsg, "error");
        }
      } catch (error) {
        console.error("Google Sign-In Error:", error);
        showToast(error.message || t("auth.messages.google_failed"), "error");
      } finally {
        setLoading(false);
      }
    };
  
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
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
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
              paddingBottom: insets.bottom + 100,
              flexGrow: 1,
              justifyContent: 'center'
            }}
          >

            {/* BACK */}
            <TouchableOpacity onPress={handleGoBack} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} style={{ alignSelf: 'flex-start' }}>
              <FontAwesomeIcon icon={faArrowLeft} size={20} color={colors.text} />
            </TouchableOpacity>

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
            <Text className="text-center text-3xl font-redditsans-bold mb-4 mt-2" style={{ color: colors.text }}>
              {t("auth.lets_start")}
            </Text>

            {/* GOOGLE */}
            <TouchableOpacity 
              className="flex-row justify-center rounded-full p-3 mb-6"
              style={[styles.googleButton, { backgroundColor: colors.card }]}
              onPress={handleGoogleLogin}
              disabled={loading}
            >
              <GoogleIcon width={22} height={22} />
              <Text className="font-redditsans-medium text-lg ml-4" style={{ color: colors.text }}>
                {t("auth.google_continue")}
              </Text>
            </TouchableOpacity>

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

            {/* First + Last */}
            <View className="flex-row gap-3">
              <TextInput
                ref={firstNameRef}
                placeholder={t("auth.first_name")}
                placeholderTextColor={colors.textSecondary}
                onChangeText={(text) => handleInputChange("firstname", text)}
                onFocus={() => scrollToInput(firstNameRef)}
                returnKeyType="next"
                onSubmitEditing={() => lastNameRef.current?.focus()}
                className="flex-1 font-redditsans-medium rounded-xl p-4 mb-4"
                style={[styles.modernInput, { backgroundColor: colors.card, color: colors.text }]}
              />
              <TextInput
                ref={lastNameRef}
                placeholder={t("auth.last_name")}
                placeholderTextColor={colors.textSecondary}
                onChangeText={(text) => handleInputChange("lastname", text)}
                onFocus={() => scrollToInput(lastNameRef)}
                returnKeyType="next"
                onSubmitEditing={() => usernameRef.current?.focus()}
                className="flex-1 font-redditsans-medium rounded-xl p-4 mb-4"
                style={[styles.modernInput, { backgroundColor: colors.card, color: colors.text }]}
              />
            </View>

            {/* Username */}
            <TextInput
              ref={usernameRef}
              placeholder={t("auth.username")}
              placeholderTextColor={colors.textSecondary}
              onChangeText={(text) => handleInputChange("username", text)}
              onFocus={() => scrollToInput(usernameRef)}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              className="font-redditsans-medium rounded-xl p-4 mb-4"
              style={[styles.modernInput, { backgroundColor: colors.card, color: colors.text }]}
            />

            {/* Email */}
            <TextInput
              ref={emailRef}
              placeholder={t("auth.email")}
              placeholderTextColor={colors.textSecondary}
              onChangeText={(text) => handleInputChange("email", text)}
              onFocus={() => scrollToInput(emailRef)}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              className="font-redditsans-medium rounded-xl p-4 mb-4"
              style={[styles.modernInput, { backgroundColor: colors.card, color: colors.text }]}
            />

            {/* Password */}
            <View className="relative">
              <TextInput
                ref={passwordRef}
                placeholder={t("auth.password")}
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showPassword}
                onChangeText={(text) => handleInputChange("password", text)}
                onFocus={() => scrollToInput(passwordRef)}
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                className="font-redditsans-medium rounded-xl p-4 mb-4"
                style={[styles.modernInput, { backgroundColor: colors.card, color: colors.text }]}
              />
              <TouchableOpacity 
                className="absolute right-4 top-4"
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <View className="relative">
              <TextInput
                ref={confirmPasswordRef}
                placeholder={t("auth.confirm_password")}
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showConfirmPassword}
                onChangeText={(text) => handleInputChange("confirmPassword", text)}
                onFocus={() => scrollToInput(confirmPasswordRef)}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
                className="font-redditsans-medium rounded-xl p-4 mb-6"
                style={[styles.modernInput, { backgroundColor: colors.card, color: colors.text }]}
              />
              <TouchableOpacity 
                className="absolute right-4 top-4"
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <FontAwesomeIcon icon={showConfirmPassword ? faEye : faEyeSlash} size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* BUTTON */}
            <TouchableOpacity 
              className="p-3 rounded-full"
              onPress={handleRegister}
              disabled={loading}
              style={[styles.modernButton, { backgroundColor: colors.primary, opacity: loading ? 0.75 : 1 }]}
              activeOpacity={0.8}
            >
              <Text className="text-white text-center font-redditsans-bold text-lg">
                {loading ? t("auth.creating_account") : t("auth.sign_up")}
              </Text>
            </TouchableOpacity>

            {/* LOGIN */}
            <View className="flex-row justify-center mt-6">
              <Text className="font-redditsans-medium" style={{ color: colors.textSecondary }}>{t("auth.have_account")} </Text>
              <TouchableOpacity onPress={()=>navigation.navigate("Login")} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text className="font-redditsans-bold" style={{ color: colors.primary }}>{t("auth.sign_in")}</Text>
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

export default Register;
