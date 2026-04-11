import { View, Text, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import GrowDayLogo from "../../../assets/icons/growday-logo.svg";
import GoogleIcon from "../../../assets/icons/google-logo.svg";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEye, faEyeSlash, faArrowLeft, faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import { registerfetch } from "../../utils/fetch";
import { storage } from "../../utils/MMKVStore";
import Toast from "../../components/common/Toast";


const Register = () => {
    const navigation = useNavigation();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    }
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
            ? data.errors
            : [data.message || "Registration failed. Please try again."];
          // Register-də həmişə inline list — şifrə qaydaları çox ola bilər
          setServerErrors(msgs);
        }
      } catch (error) {
        setServerErrors(["Network error. Please check your connection."]);
      } finally {
        setLoading(false);
      }
    }
    const handleGoBack = () => {
      navigation.goBack();
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
      <SafeAreaView className="flex-1">

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
        >

          {/* BACK */}
          <TouchableOpacity onPress={handleGoBack}>
            <FontAwesomeIcon icon={faArrowLeft} size={20} color="#3F414E" />
          </TouchableOpacity>

          {/* Logo */}
          <View className="items-center mt-4">
            <GrowDayLogo width={140} height={140} />
          </View>

          {/* Title */}
          <Text className="text-white text-center text-4xl font-redditsans-bold mb-4">
            Create your account!
          </Text>

          {/* GOOGLE */}
          <TouchableOpacity className="flex-row justify-center bg-white rounded-full p-5 mb-6">
            <GoogleIcon width={22} height={22} />
            <Text className="text-black font-redditsans-medium text-lg ml-4">
              CONTINUE WITH GOOGLE
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

          {/* First + Last */}
          <View className="flex-row gap-3">
            <TextInput
              placeholder="First Name"
              placeholderTextColor="#aaa"
              onChangeText={(text) => handleInputChange("firstname", text)}
              className="flex-1 font-redditsans-medium bg-white rounded-xl p-4 mb-4 text-black"
            />
            <TextInput
              placeholder="Last Name"
              placeholderTextColor="#aaa"
              onChangeText={(text) => handleInputChange("lastname", text)}
              className="flex-1 font-redditsans-medium bg-white rounded-xl p-4 mb-4 text-black"
            />
          </View>

          {/* Username */}
          <TextInput
            placeholder="Username"
            placeholderTextColor="#aaa"
            onChangeText={(text) => handleInputChange("username", text)}
            className="bg-white font-redditsans-medium rounded-xl p-4 mb-4 text-black"
          />

          {/* Email */}
          <TextInput
            placeholder="Email"
            placeholderTextColor="#aaa"
            onChangeText={(text) => handleInputChange("email", text)}
            className="bg-white font-redditsans-medium rounded-xl p-4 mb-4 text-black"
          />

          {/* Password */}
          <View className="relative">
            <TextInput
              placeholder="Password"
              placeholderTextColor="#aaa"
              secureTextEntry={!showPassword}
              onChangeText={(text) => handleInputChange("password", text)}
              className="bg-white font-redditsans-medium rounded-xl p-4 mb-4 text-black"
            />
            <TouchableOpacity 
              className="absolute right-4 top-4"
              onPress={() => setShowPassword(!showPassword)}
            >
              <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} size={20} color="#999" />
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <View className="relative">
            <TextInput
              placeholder="Confirm Password"
              placeholderTextColor="#aaa"
              secureTextEntry={!showConfirmPassword}
              onChangeText={(text) => handleInputChange("confirmPassword", text)}
              className="bg-white font-redditsans-medium rounded-xl p-4 mb-6 text-black"
            />
            <TouchableOpacity 
              className="absolute right-4 top-4"
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <FontAwesomeIcon icon={showConfirmPassword ? faEye : faEyeSlash} size={20} color="#999" />
            </TouchableOpacity>
          </View>

          {/* BUTTON */}
          <TouchableOpacity 
            className="bg-[#78C67E] p-4 rounded-full"
            onPress={handleRegister}
            disabled={loading}
            style={{ opacity: loading ? 0.75 : 1 }}
          >
            <Text className="text-white text-center font-redditsans-bold text-lg">
              {loading ? "Creating Account..." : "Sign Up"}
            </Text>
          </TouchableOpacity>

          {/* LOGIN */}
          <View className="flex-row justify-center mt-6">
            <Text className="text-white font-redditsans-medium">Already have an account? </Text>
            <TouchableOpacity onPress={()=>navigation.navigate("Login")}>
              <Text className="text-white font-redditsans-bold">Sign In</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>

      </SafeAreaView>
    </KeyboardAvoidingView>
  </LinearGradient>
      </View>
    );
  };
  
  export default Register;
