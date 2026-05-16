import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, ActivityIndicator, Image } from "react-native";
import { useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GrowDayLogo from "../../../assets/images/main logo.png";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faCircleExclamation, faLock, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { resetPasswordFetch } from "../../utils/fetch";
import Toast from "../../components/common/Toast";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";

const ResetPassword = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { token, email } = route.params || {};
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverErrors, setServerErrors] = useState([]);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
  };

  const handleResetPassword = async () => {
    setServerErrors([]);
    if (!password) {
        setServerErrors([t("auth.messages.password_required")]);
        return;
    }
    if (password !== confirmPassword) {
        setServerErrors([t("auth.messages.passwords_dont_match")]);
        return;
    }

    setLoading(true);
    try {
      const data = await resetPasswordFetch(token, password, confirmPassword);
      if (data.success) {
        showToast(t("auth.messages.password_reset_success"), "success");
        setTimeout(() => {
          navigation.navigate("Login");
        }, 2000);
      } else {
        const msgs = data.errors?.length > 0
          ? data.errors
          : [data.message || t("auth.messages.reset_failed")];
        setServerErrors(msgs);
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
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} style={{ alignSelf: 'flex-start' }}>
              <FontAwesomeIcon icon={faArrowLeft} size={20} color={colors.text} />
            </TouchableOpacity>

            <View className="items-center mt-2 mb-6">
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
            <Text className="text-center text-4xl font-redditsans-bold mb-4" style={{ color: colors.text }}>
              {t("auth.reset_password_title")}
            </Text>

            <Text className="text-lg text-center font-redditsans-medium mb-6" style={{ color: colors.textSecondary }}>
              {t("auth.reset_password_desc")}
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

            {/* Password input */}
            <View className="relative mb-4">
              <TextInput
                  placeholder={t("auth.new_password")}
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={(t) => { setPassword(t); setServerErrors([]); }}
                  secureTextEntry={!showPassword}
                  className="font-redditsans-medium rounded-xl p-4 pr-12"
                  style={[styles.modernInput, { backgroundColor: colors.card, color: colors.text }]}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 16, top: 16 }}
              >
                <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Confirm Password input */}
            <View className="relative mb-8">
              <TextInput
                  placeholder={t("auth.confirm_new_password")}
                  placeholderTextColor={colors.textSecondary}
                  value={confirmPassword}
                  onChangeText={(t) => { setConfirmPassword(t); setServerErrors([]); }}
                  secureTextEntry={!showConfirmPassword}
                  className="font-redditsans-medium rounded-xl p-4 pr-12"
                  style={[styles.modernInput, { backgroundColor: colors.card, color: colors.text }]}
              />
              <TouchableOpacity 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ position: 'absolute', right: 16, top: 16 }}
              >
                <FontAwesomeIcon icon={showConfirmPassword ? faEye : faEyeSlash} size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Button */}
            <TouchableOpacity
                className="p-3 rounded-full"
                onPress={handleResetPassword}
                disabled={loading}
                style={[styles.modernButton, { backgroundColor: colors.primary, opacity: loading ? 0.75 : 1 }]}
                activeOpacity={0.8}
            >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text className="text-white text-center font-redditsans-bold text-lg">
                        {t("auth.reset_password_btn")}
                    </Text>
                )}
            </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
    </View>
  );
}

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

export default ResetPassword;
