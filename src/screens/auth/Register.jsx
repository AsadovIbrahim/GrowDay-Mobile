import { View, Text,TouchableOpacity,TextInput,ScrollView, KeyboardAvoidingView, Platform  } from "react-native";
import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import GrowDayLogo from "../../../assets/icons/growday-logo.svg";
import GoogleIcon from "../../../assets/icons/google-logo.svg";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faEye, faEyeSlash,faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { registerfetch } from "../../utils/fetch";
import { storage } from "../../utils/MMKVStore";


const Register = () => {
    const navigation = useNavigation();
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({});
    const [showGoBack,setShowGoBack]=useState(true);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
  
    const handleInputChange = (name, text) => {
      setFormData({ ...formData, [name]: text });
    }
    const handleRegister = async() => {
      await registerfetch(formData)
      .then((data) => {
        console.log(data);
        storage.set("firstName", formData.firstName);
        storage.set("lastName", formData.lastName);
        storage.set("username", formData.username);
        storage.set("email", formData.email);
        
        storage.set("hasCompletedPreferences", false);
        
        navigation.navigate("OtpVerification", { email: formData.email });
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
            <Text className="text-black text-lg ml-4">
              CONTINUE WITH GOOGLE
            </Text>
          </TouchableOpacity>

          {/* First + Last */}
          <View className="flex-row gap-3">
            <TextInput
              placeholder="First Name"
              placeholderTextColor="#aaa"
              onChangeText={(text) => handleInputChange("firstName", text)}
              className="flex-1 bg-white rounded-xl p-4 mb-4 text-black"
            />
            <TextInput
              placeholder="Last Name"
              placeholderTextColor="#aaa"
              onChangeText={(text) => handleInputChange("lastName", text)}
              className="flex-1 bg-white rounded-xl p-4 mb-4 text-black"
            />
          </View>

          {/* Username */}
          <TextInput
            placeholder="Username"
            placeholderTextColor="#aaa"
            onChangeText={(text) => handleInputChange("username", text)}
            className="bg-white rounded-xl p-4 mb-4 text-black"
          />

          {/* Email */}
          <TextInput
            placeholder="Email"
            placeholderTextColor="#aaa"
            onChangeText={(text) => handleInputChange("email", text)}
            className="bg-white rounded-xl p-4 mb-4 text-black"
          />

          {/* Password */}
          <View className="relative">
            <TextInput
              placeholder="Password"
              placeholderTextColor="#aaa"
              secureTextEntry={!showPassword}
              onChangeText={(text) => handleInputChange("password", text)}
              className="bg-white rounded-xl p-4 mb-4 text-black"
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
              secureTextEntry={!showPassword}
              onChangeText={(text) => handleInputChange("confirmPassword", text)}
              className="bg-white rounded-xl p-4 mb-6 text-black"
            />
            <TouchableOpacity 
              className="absolute right-4 top-4"
              onPress={() => setShowPassword(!showPassword)}
            >
              <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} size={20} color="#999" />
            </TouchableOpacity>
          </View>

          {/* BUTTON */}
          <TouchableOpacity 
            className="bg-[#78C67E] p-4 rounded-full"
            onPress={handleRegister}
          >
            <Text className="text-white text-center font-bold text-lg">
              Sign Up
            </Text>
          </TouchableOpacity>

          {/* LOGIN */}
          <View className="flex-row justify-center mt-6">
            <Text className="text-white">Already have an account? </Text>
            <TouchableOpacity onPress={()=>navigation.navigate("Login")}>
              <Text className="text-white font-bold">Sign In</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>

      </SafeAreaView>
    </KeyboardAvoidingView>
  </LinearGradient>
    );
  };
  
  export default Register;
