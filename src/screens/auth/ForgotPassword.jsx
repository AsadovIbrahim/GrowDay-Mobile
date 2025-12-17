import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import GrowDayLogo from "../../../assets/icons/growday-logo.svg";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import {forgotPasswordfetch} from "../../utils/fetch"



const ForgotPassword=()=>{

  const navigation = useNavigation();
  const [formData, setFormData] = useState({});
  const [showGoBack,setShowGoBack]=useState(true);

  const handleInputChange = (name, text) => {
    setFormData({ ...formData, [name]: text });
  }
  const handleForgotPassword = () => {
    forgotPasswordfetch(formData)
    .then((data) => {
      console.log(data);
    }).catch((error) => {
      console.log(error);
    });    
  }

  const handleGoBack = () => {
    navigation.goBack();
  }
  return (
    <LinearGradient
      colors={["#E9E6D7", "rgba(32,137,58,1)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1 w-full px-6">

      <TouchableOpacity onPress={handleGoBack}>
          <FontAwesomeIcon icon={faArrowLeft} size={20} color="#3F414E" />
        </TouchableOpacity>
        {/* Logo */} 
        <View className="items-center mt-2 mb-6">
          <GrowDayLogo width={140} height={140} />
        </View>

        {/* Welcome */}
        <Text className="text-white text-center text-4xl font-redditsans-bold mb-8">
          Forgot Password?
        </Text>

        

        {/* OR TEXT */}
        <Text className="text-lg text-white text-center font-redditsans-medium mb-6 font-medium">
        Enter your email address below and we’ll send you a link to reset your password.        </Text>

        {/* Email input */}
          <View className="relative">

            <TextInput
              placeholder="Enter your email"
              placeholderTextColor="#ddd"
              onChangeText={(text) => handleInputChange("email", text)}
              className="font-redditsans-medium bg-white rounded-xl p-5 px-4 mb-6 text-black"
              />
          </View>
         


        {/* LOGIN BUTTON */}
        <TouchableOpacity className="bg-[#78C67E] p-5 rounded-full" onPress={handleForgotPassword}>
          <Text className="capitalize text-white text-center font-redditsans-bold text-lg">
            send reset link
          </Text>
        </TouchableOpacity>

        {/* SIGN UP LINK */}
        <View className="flex-row justify-center mt-6">
          <Text className="text-white font-redditsans-regular">Back to </Text>
          <TouchableOpacity onPress={()=>navigation.navigate("Login")}>
            <Text className="text-white font-redditsans-bold">Sign In</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </LinearGradient>
  );
}

export default ForgotPassword;