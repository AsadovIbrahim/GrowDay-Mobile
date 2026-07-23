import { View, Text, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Image } from "react-native";
import { useState, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GrowDayLogo from "../../../assets/images/main logo.png";
import GoogleIcon from "../../../assets/icons/google-logo.svg";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEye, faEyeSlash, faArrowLeft, faCircleExclamation, faEnvelope, faLock, faUser, faCheckCircle, faCircle } from '@fortawesome/free-solid-svg-icons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GOOGLE_WEB_CLIENT_ID } from '@env';
import { registerfetch, googleLoginFetch, getUserPreferencesFetch } from "../../utils/fetch";
import { translateAuthError, translateAuthErrors } from "../../utils/translateAuthError";
import { storage, clearUserSession } from "../../utils/MMKVStore";
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
  const [focusedInput, setFocusedInput] = useState(null);

  const passwordVal = formData.password || "";
  const requirements = [
    { label: t('profile.change_password_screen.requirements.min_chars', { defaultValue: '8+ chars' }), met: passwordVal.length >= 8 },
    { label: t('profile.change_password_screen.requirements.uppercase', { defaultValue: 'Uppercase' }), met: /[A-Z]/.test(passwordVal) },
    { label: t('profile.change_password_screen.requirements.lowercase', { defaultValue: 'Lowercase' }), met: /[a-z]/.test(passwordVal) },
    { label: t('profile.change_password_screen.requirements.number', { defaultValue: 'Number' }), met: /[0-9]/.test(passwordVal) },
    { label: t('profile.change_password_screen.requirements.special', { defaultValue: 'Special' }), met: /[!@#$%^&*(),.?":{}|<>]/.test(passwordVal) },
  ];
  const allMet = requirements.every(r => r.met);

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
  const handleRegister = async () => {
    const nameRegex = /^[\p{L}\s'\-]+$/u;
    const usernameRegex = /^[a-zA-Z0-9._]{3,30}$/;
    const validationErrors = [];

    if (!formData.firstname?.trim()) {
      validationErrors.push(t("profile.edit_profile_screen.validation.first_name_required", "Ad mütləqdir"));
    } else if (!nameRegex.test(formData.firstname.trim())) {
      validationErrors.push(t("profile.edit_profile_screen.validation.first_name_invalid", "Ad yalnız hərflərdən ibarət olmalıdır"));
    }

    if (!formData.lastname?.trim()) {
      validationErrors.push(t("profile.edit_profile_screen.validation.last_name_required", "Soyad mütləqdir"));
    } else if (!nameRegex.test(formData.lastname.trim())) {
      validationErrors.push(t("profile.edit_profile_screen.validation.last_name_invalid", "Soyad yalnız hərflərdən ibarət olmalıdır"));
    }

    if (!formData.username?.trim()) {
      validationErrors.push(t("profile.edit_profile_screen.validation.username_required", "İstifadəçi adı mütləqdir"));
    } else if (!usernameRegex.test(formData.username.trim())) {
      validationErrors.push(t("profile.edit_profile_screen.validation.username_invalid", "İstifadəçi adı yalnız hərflər, rəqəmlər, nöqtə və alt xəttdən ibarət olmalıdır"));
    }

    if (!formData.password) {
      validationErrors.push(t("auth.messages.password_required", "Şifrə mütləqdir"));
    } else if (!allMet) {
      validationErrors.push(t("profile.change_password_screen.validation.requirements", "Bütün şifrə tələblərini yerinə yetirin"));
    }

    if (formData.password !== formData.confirmPassword) {
      validationErrors.push(t("auth.messages.passwords_dont_match", "Şifrələr uyğun gəlmir"));
    }

    if (validationErrors.length > 0) {
      setServerErrors(validationErrors);
      return;
    }

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
          ? translateAuthErrors(data.errors, t)
          : [translateAuthError(data.message, t) || t("auth.messages.registration_failed")];
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
    GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });

    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      const idToken = userInfo?.data?.idToken || userInfo?.idToken;

      if (!idToken) {
        setLoading(false);
        if (userInfo?.type === 'cancelled') return;
        showToast(t("auth.messages.google_token_not_found"), "error");
        return;
      }

      setLoading(true);
      const data = await googleLoginFetch(idToken);

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
        const errorMsg = data?.message || data?.title || t("auth.messages.google_signup_failed");
        showToast(errorMsg, "error");
      }
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      const clientPrefix = GOOGLE_WEB_CLIENT_ID ? GOOGLE_WEB_CLIENT_ID.substring(0, 15) : 'null';
      showToast(`${error.message || t("auth.messages.google_failed")} (ID: ${clientPrefix}...)`, "error");
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

            <TouchableOpacity onPress={handleGoBack} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} style={{ alignSelf: 'flex-start', marginBottom: 10 }}>
              <FontAwesomeIcon icon={faArrowLeft} size={20} color={colors.text} />
            </TouchableOpacity>

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

            <Text className="text-center text-3xl font-redditsans-bold mt-2 mb-1" style={{ color: colors.text }}>
              {t("auth.lets_start")}
            </Text>
            <Text className="text-center text-sm font-redditsans-medium mb-8" style={{ color: colors.textSecondary }}>
              {t("auth.register_subtitle", "Create an account to manage your habits")}
            </Text>

            <TouchableOpacity
              className="flex-row justify-center items-center rounded-2xl py-3.5 mb-6 border"
              style={[styles.googleButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleGoogleLogin}
              disabled={loading}
            >
              <GoogleIcon width={20} height={20} />
              <Text className="font-redditsans-bold text-base ml-3" style={{ color: colors.text }}>
                {t("auth.google_continue")}
              </Text>
            </TouchableOpacity>

            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-[1.5px]" style={{ backgroundColor: colors.border, opacity: 0.8 }} />
              <Text className="mx-4 text-xs font-redditsans-bold uppercase tracking-wider" style={{ color: colors.textSecondary, opacity: 0.7 }}>
                {t("auth.or_register_email", "OR REGISTER WITH EMAIL")}
              </Text>
              <View className="flex-1 h-[1.5px]" style={{ backgroundColor: colors.border, opacity: 0.8 }} />
            </View>

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

            <View className="flex-row gap-3">
              <View
                className="flex-1 flex-row items-center rounded-2xl px-4 mb-4 border"
                style={{
                  backgroundColor: colors.card,
                  borderColor: focusedInput === 'firstname' ? colors.primary : colors.border,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: focusedInput === 'firstname' ? 6 : 1 },
                  shadowOpacity: focusedInput === 'firstname' ? 0.12 : 0.02,
                  shadowRadius: focusedInput === 'firstname' ? 8 : 2,
                  elevation: focusedInput === 'firstname' ? 4 : 1,
                }}
              >
                <View style={{ width: 18, alignItems: 'center' }}>
                  <FontAwesomeIcon
                    icon={faUser}
                    color={focusedInput === 'firstname' ? colors.primary : colors.textSecondary}
                    size={15}
                  />
                </View>
                <TextInput
                  ref={firstNameRef}
                  placeholder={t("auth.first_name")}
                  placeholderTextColor={colors.textSecondary}
                  onChangeText={(text) => handleInputChange("firstname", text)}
                  onFocus={() => { setFocusedInput('firstname'); scrollToInput(firstNameRef); }}
                  onBlur={() => setFocusedInput(null)}
                  returnKeyType="next"
                  onSubmitEditing={() => lastNameRef.current?.focus()}
                  className="flex-1 py-3.5 pl-2 font-redditsans-medium text-base"
                  style={{ color: colors.text }}
                />
              </View>
              <View
                className="flex-1 flex-row items-center rounded-2xl px-4 mb-4 border"
                style={{
                  backgroundColor: colors.card,
                  borderColor: focusedInput === 'lastname' ? colors.primary : colors.border,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: focusedInput === 'lastname' ? 6 : 1 },
                  shadowOpacity: focusedInput === 'lastname' ? 0.12 : 0.02,
                  shadowRadius: focusedInput === 'lastname' ? 8 : 2,
                  elevation: focusedInput === 'lastname' ? 4 : 1,
                }}
              >
                <View style={{ width: 18, alignItems: 'center' }}>
                  <FontAwesomeIcon
                    icon={faUser}
                    color={focusedInput === 'lastname' ? colors.primary : colors.textSecondary}
                    size={15}
                  />
                </View>
                <TextInput
                  ref={lastNameRef}
                  placeholder={t("auth.last_name")}
                  placeholderTextColor={colors.textSecondary}
                  onChangeText={(text) => handleInputChange("lastname", text)}
                  onFocus={() => { setFocusedInput('lastname'); scrollToInput(lastNameRef); }}
                  onBlur={() => setFocusedInput(null)}
                  returnKeyType="next"
                  onSubmitEditing={() => usernameRef.current?.focus()}
                  className="flex-1 py-3.5 pl-2 font-redditsans-medium text-base"
                  style={{ color: colors.text }}
                />
              </View>
            </View>

            <View
              className="flex-row items-center rounded-2xl px-4 mb-4 border"
              style={{
                backgroundColor: colors.card,
                borderColor: focusedInput === 'username' ? colors.primary : colors.border,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: focusedInput === 'username' ? 6 : 1 },
                shadowOpacity: focusedInput === 'username' ? 0.12 : 0.02,
                shadowRadius: focusedInput === 'username' ? 8 : 2,
                elevation: focusedInput === 'username' ? 4 : 1,
              }}
            >
              <View style={{ width: 24, alignItems: 'center' }}>
                <FontAwesomeIcon
                  icon={faUser}
                  color={focusedInput === 'username' ? colors.primary : colors.textSecondary}
                  size={18}
                />
              </View>
              <TextInput
                ref={usernameRef}
                placeholder={t("auth.username")}
                placeholderTextColor={colors.textSecondary}
                onChangeText={(text) => handleInputChange("username", text)}
                onFocus={() => { setFocusedInput('username'); scrollToInput(usernameRef); }}
                onBlur={() => setFocusedInput(null)}
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                className="flex-1 py-3.5 pl-3 font-redditsans-medium text-base"
                style={{ color: colors.text }}
                autoCapitalize="none"
              />
            </View>

            <View
              className="flex-row items-center rounded-2xl px-4 mb-4 border"
              style={{
                backgroundColor: colors.card,
                borderColor: focusedInput === 'email' ? colors.primary : colors.border,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: focusedInput === 'email' ? 6 : 1 },
                shadowOpacity: focusedInput === 'email' ? 0.12 : 0.02,
                shadowRadius: focusedInput === 'email' ? 8 : 2,
                elevation: focusedInput === 'email' ? 4 : 1,
              }}
            >
              <View style={{ width: 24, alignItems: 'center' }}>
                <FontAwesomeIcon
                  icon={faEnvelope}
                  color={focusedInput === 'email' ? colors.primary : colors.textSecondary}
                  size={18}
                />
              </View>
              <TextInput
                ref={emailRef}
                placeholder={t("auth.email")}
                placeholderTextColor={colors.textSecondary}
                onChangeText={(text) => handleInputChange("email", text)}
                onFocus={() => { setFocusedInput('email'); scrollToInput(emailRef); }}
                onBlur={() => setFocusedInput(null)}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                className="flex-1 py-3.5 pl-3 font-redditsans-medium text-base"
                style={{ color: colors.text }}
              />
            </View>

            <View
              className="flex-row items-center rounded-2xl px-4 mb-4 border"
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
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                className="flex-1 py-3.5 pl-3 pr-10 font-redditsans-medium text-base"
                style={{ color: colors.text }}
                autoCapitalize="none"
              />
              <TouchableOpacity
                className="absolute right-4"
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Password Requirements Badges */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {requirements.map((req, index) => (
                <View 
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 20,
                    backgroundColor: req.met ? (colors.success + '20' || 'rgba(74, 222, 128, 0.2)') : (colors.card + '80'),
                    borderWidth: 1,
                    borderColor: req.met ? (colors.success || '#4ade80') : 'transparent',
                  }}
                >
                  <FontAwesomeIcon 
                    icon={req.met ? faCheckCircle : faCircle} 
                    size={11} 
                    color={req.met ? (colors.success || '#4ade80') : colors.textSecondary} 
                  />
                  <Text style={{ fontSize: 12, fontFamily: req.met ? 'RedditSans-Bold' : 'RedditSans-Medium', color: req.met ? colors.text : colors.textSecondary }}>
                    {req.label}
                  </Text>
                </View>
              ))}
            </View>

            <View
              className="flex-row items-center rounded-2xl px-4 mb-6 border"
              style={{
                backgroundColor: colors.card,
                borderColor: focusedInput === 'confirmPassword' ? colors.primary : colors.border,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: focusedInput === 'confirmPassword' ? 6 : 1 },
                shadowOpacity: focusedInput === 'confirmPassword' ? 0.12 : 0.02,
                shadowRadius: focusedInput === 'confirmPassword' ? 8 : 2,
                elevation: focusedInput === 'confirmPassword' ? 4 : 1,
              }}
            >
              <View style={{ width: 24, alignItems: 'center' }}>
                <FontAwesomeIcon
                  icon={faLock}
                  color={focusedInput === 'confirmPassword' ? colors.primary : colors.textSecondary}
                  size={18}
                />
              </View>
              <TextInput
                ref={confirmPasswordRef}
                placeholder={t("auth.confirm_password")}
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showConfirmPassword}
                onChangeText={(text) => handleInputChange("confirmPassword", text)}
                onFocus={() => { setFocusedInput('confirmPassword'); scrollToInput(confirmPasswordRef); }}
                onBlur={() => setFocusedInput(null)}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
                className="flex-1 py-3.5 pl-3 pr-10 font-redditsans-medium text-base"
                style={{ color: colors.text }}
                autoCapitalize="none"
              />
              <TouchableOpacity
                className="absolute right-4"
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <FontAwesomeIcon icon={showConfirmPassword ? faEye : faEyeSlash} size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
              style={[styles.modernButton, { opacity: loading ? 0.75 : 1 }]}
            >
              <View style={{ borderRadius: 20, overflow: "hidden" }}>
                <LinearGradient
                  colors={[colors.primaryLight || '#4caf66', colors.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <View style={{ paddingVertical: 14 }}>
                    <Text className="text-white text-center font-redditsans-bold text-lg">
                      {loading ? t("auth.creating_account") : t("auth.sign_up")}
                    </Text>
                  </View>
                </LinearGradient>
              </View>
            </TouchableOpacity>

            <View className="flex-row justify-center mt-6">
              <Text className="font-redditsans-medium" style={{ color: colors.textSecondary }}>{t("auth.have_account")} </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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

export default Register;
