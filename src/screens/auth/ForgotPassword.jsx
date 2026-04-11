import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import GrowDayLogo from "../../../assets/icons/growday-logo.svg";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faCircleExclamation, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { forgotPasswordfetch } from "../../utils/fetch";
import Toast from "../../components/common/Toast";



const ForgotPassword = () => {

  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverErrors, setServerErrors] = useState([]);
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    setServerErrors([]);
    try {
      const data = await forgotPasswordfetch({ email });
      if (data.success) {
        setSuccess(true);
      } else {
        const msgs = data.errors?.length > 0
          ? data.errors
          : [data.message || "Something went wrong. Please try again."];

        if (msgs.length === 1) {
          showToast(msgs[0], "error");
        } else {
          setServerErrors(msgs);
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
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
      />

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
          contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
        >
          <SafeAreaView>

            {/* Back */}
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <FontAwesomeIcon icon={faArrowLeft} size={20} color="#3F414E" />
            </TouchableOpacity>

            {/* Logo */}
            <View className="items-center mt-2 mb-6">
              <GrowDayLogo width={140} height={140} />
            </View>

            {/* Title */}
            <Text className="text-white text-center text-4xl font-redditsans-bold mb-4">
              Forgot Password?
            </Text>

            <Text className="text-lg text-white text-center font-redditsans-medium mb-6">
              Enter your email address below and we'll send you a link to reset your password.
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
                  Reset link sent!
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.85)", fontFamily: "RedditSans-Medium", fontSize: 13, marginTop: 6, textAlign: "center" }}>
                  Check your inbox and follow the instructions.
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

            {/* Email input */}
            {!success && (
              <>
                <TextInput
                  placeholder="Enter your email"
                  placeholderTextColor="#ddd"
                  value={email}
                  onChangeText={(t) => { setEmail(t); setServerErrors([]); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="font-redditsans-medium bg-white rounded-xl p-5 px-4 mb-6 text-black"
                />

                {/* Button */}
                <TouchableOpacity
                  className="bg-[#78C67E] p-5 rounded-full"
                  onPress={handleForgotPassword}
                  disabled={loading}
                  style={{ opacity: loading ? 0.75 : 1 }}
                >
                  <Text className="capitalize text-white text-center font-redditsans-bold text-lg">
                    {loading ? "Sending..." : "Send Reset Link"}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* Back to Sign In */}
            <View className="flex-row justify-center mt-6">
              <Text className="text-white font-redditsans-regular">Back to </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text className="text-white font-redditsans-bold">Sign In</Text>
              </TouchableOpacity>
            </View>

          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
    </View>
  );
}

export default ForgotPassword;