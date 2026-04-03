import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity } from "react-native";
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
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1 w-full px-6">

       
   
        <View className="items-center mt-2 mb-6">
          <GrowDayLogo width={140} height={140} />
        </View>

        <Text className="text-white text-center text-4xl font-redditsans-bold mb-8">
          Welcome Back!
        </Text>

        <TouchableOpacity
          className="flex-row justify-center bg-white rounded-full p-5 px-5 mb-6"
        >
          <GoogleIcon width={22} height={22} />
          <Text className="text-black text-lg font-redditsans-regular ml-4">
            CONTINUE WITH GOOGLE
          </Text>
        </TouchableOpacity>

        <Text className="text-lg text-white text-center font-redditsans-medium mb-6 font-medium">
          OR LOG IN WITH EMAIL
        </Text>

          <View className="relative">

            <TextInput
              placeholder="Email or Username"
              placeholderTextColor="#ddd"
              onChangeText={(text) => handleInputChange("UsernameOrEmail", text)}
              className="font-redditsans-medium bg-white rounded-xl p-5 px-4 mb-6 text-black"
              />
          </View>
          <View className="relative">
            <TextInput
              placeholder="Password"
              placeholderTextColor="#ddd"
              secureTextEntry={!showPassword}
              onChangeText={(text) => handleInputChange("password", text)}
              className="font-redditsans-medium bg-white rounded-xl p-5 px-4 text-black"
            />
            <TouchableOpacity className="absolute top-5 right-4" onPress={() => setShowPassword(!showPassword)}>
              <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} size={20} color="#ddd" />
            </TouchableOpacity>
            
          </View>


        <TouchableOpacity onPress={()=>navigation.navigate("ForgotPassword")} className="mt-2 mb-6">
          <Text className="text-white text-right font-redditsans-regular pt-4">Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity className="bg-[#78C67E] p-5 rounded-full" onPress={handleLogin}>
          <Text className="text-white text-center font-redditsans-bold text-lg">
            Sign In
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center mt-6">
          <Text className="text-white font-redditsans-regular">Don’t have an account? </Text>
          <TouchableOpacity onPress={()=>navigation.navigate("Register")}>
            <Text className="text-white font-redditsans-bold">Sign Up</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </LinearGradient>
  );
};

export default Login;
