import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity,KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import GrowDayLogo from "../../../assets/icons/growday-logo.svg";
import GoogleIcon from "../../../assets/icons/google-logo.svg";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'
import { storage } from "../../utils/MMKVStore";
import { View } from "react-native";  
import {loginfetch, getUserPreferencesFetch} from "../../utils/fetch"



const Login = () => {
  const navigation = useNavigation();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({});
  const [showGoBack,setShowGoBack]=useState(true);

  const handleInputChange = (name, text) => {
    setFormData({ ...formData, [name]: text });
  }
  const handleLogin = async () => {
    try {
      const data = await loginfetch(formData);
      if(data.success){
        const token = data.data.accessToken.token;
        storage.set("accessToken", token);
        console.log(token);
        storage.set("UsernameOrEmail", formData.UsernameOrEmail);
        console.log(formData.UsernameOrEmail);
        
        try {
          const preferencesResponse = await getUserPreferencesFetch(token);
          
          if (preferencesResponse && preferencesResponse.data && !preferencesResponse.error) {
            storage.set("hasCompletedPreferences", true);
          } else {
            storage.set("hasCompletedPreferences", false);
          }
        } catch (prefError) {
          console.log("Error checking user preferences:", prefError);
          storage.set("hasCompletedPreferences", false);
        }
        } else {
          if (data.message === "Email not confirmed.") {
            navigation.navigate("OtpVerification", { email: formData.UsernameOrEmail });
          } else {
            console.error("Error", data.message);
          }
        }
      } catch (error) {
        console.log(error);
      }    
    }

  return (
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
            <Text className="text-white text-center text-4xl font-bold mb-8">
              Welcome Back!
            </Text>

            {/* Google */}
            <TouchableOpacity className="flex-row justify-center bg-white rounded-full p-5 mb-6">
              <GoogleIcon width={22} height={22} />
              <Text className="text-black text-lg ml-4">
                CONTINUE WITH GOOGLE
              </Text>
            </TouchableOpacity>

            <Text className="text-white text-center mb-6">
              OR LOG IN WITH EMAIL
            </Text>

            {/* Email */}
            <TextInput
              placeholder="Email or Username"
              placeholderTextColor="#aaa"
              onChangeText={(text) => handleInputChange("UsernameOrEmail", text)}
              className="bg-white rounded-xl p-4 mb-4 text-black"
            />

            {/* Password */}
            <View className="relative">
              <TextInput
                placeholder="Password"
                placeholderTextColor="#aaa"
                secureTextEntry={!showPassword}
                onChangeText={(text) => handleInputChange("password", text)}
                className="bg-white rounded-xl p-4 mb-2 text-black"
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
              <Text className="text-white text-right">
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* Button */}
            <TouchableOpacity 
              className="bg-[#78C67E] p-4 rounded-full"
              onPress={handleLogin}
            >
              <Text className="text-white text-center font-bold text-lg">
                Sign In
              </Text>
            </TouchableOpacity>

            {/* Register */}
            <View className="flex-row justify-center mt-6">
              <Text className="text-white">
                Don’t have an account? 
              </Text>
              <TouchableOpacity onPress={()=>navigation.navigate("Register")}>
                <Text className="text-white font-bold"> Sign Up</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>

        </SafeAreaView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default Login;
