import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Image } from "react-native";
import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GrowDayLogo from "../../../assets/images/main logo.png";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faCircleExclamation, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { forgotPasswordfetch } from "../../utils/fetch";
import { translateAuthError, translateAuthErrors } from "../../utils/translateAuthError";
import Toast from "../../components/common/Toast";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";

const ForgotPassword = () => {

  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverErrors, setServerErrors] = useState([]);
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const [focusedInput, setFocusedInput] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    setServerErrors([]);
    try {
      const data = await forgotPasswordfetch({ email });
      if (data.success) {
        navigation.navigate("OtpVerification", { email, type: "forgot_password" });
      } else {
        const msgs = data.errors?.length > 0
          ? translateAuthErrors(data.errors, t)
          : [translateAuthError(data.message, t) || t("auth.messages.something_wrong")];

        if (msgs.length === 1) {
          showToast(msgs[0], "error");
        } else {
          setServerErrors(msgs);
        }
      }
    } catch (error) {
      showToast(t("auth.messages.network_error"), "error");
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

            {/* Back */}
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} style={{ alignSelf: 'flex-start', marginBottom: 10 }}>
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

            {/* Title */}
            <Text className="text-center text-3xl font-redditsans-bold mt-2 mb-1" style={{ color: colors.text }}>
              {t("auth.forgot_password_title")}
            </Text>

            <Text className="text-sm text-center font-redditsans-medium mb-8" style={{ color: colors.textSecondary }}>
              {t("auth.forgot_password_desc")}
            </Text>

            {/* Success banner */}
            {success && (
              <View style={{
                backgroundColor: "rgba(34,197,94,0.15)",
                borderRadius: 12,
                padding: 16,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: "rgba(34,197,94,0.4)",
                alignItems: "center",
              }}>
                <FontAwesomeIcon icon={faEnvelope} size={28} color="#22c55e" />
                <Text style={{ color: "#22c55e", fontFamily: "RedditSans-Bold", fontSize: 15, marginTop: 10, textAlign: "center" }}>
                  {t("auth.messages.reset_link_sent")}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.85)", fontFamily: "RedditSans-Medium", fontSize: 13, marginTop: 6, textAlign: "center" }}>
                  {t("auth.messages.check_inbox")}
                </Text>
              </View>
            )}

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

            {/* Email input */}
            {!success && (
              <>
                <View
                  className="flex-row items-center rounded-2xl px-4 mb-6 border"
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
                    placeholder={t("auth.enter_email")}
                    placeholderTextColor={colors.textSecondary}
                    value={email}
                    onChangeText={(t) => { setEmail(t); setServerErrors([]); }}
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="flex-1 py-3.5 pl-3 font-redditsans-medium text-base"
                    style={{ color: colors.text }}
                  />
                </View>

                {/* Button */}
                <TouchableOpacity
                  onPress={handleForgotPassword}
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
                          {loading ? t("auth.sending") : t("auth.send_reset")}
                        </Text>
                      </View>
                    </LinearGradient>
                  </View>
                </TouchableOpacity>
              </>
            )}

            {/* Back to Sign In */}
            <View className="flex-row justify-center mt-6">
              <Text className="font-redditsans-regular" style={{ color: colors.textSecondary }}>{t("auth.back_to_login")} </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text className="font-redditsans-bold" style={{ color: colors.primary }}>{t("auth.sign_in")}</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  modernButton: {
    borderRadius: 20,
    shadowColor: "#2f6f3f",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  }
});

export default ForgotPassword;