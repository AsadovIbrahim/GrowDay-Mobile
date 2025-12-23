import { View, Text,TouchableOpacity,TextInput } from "react-native";
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
        navigation.navigate("Login");
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
          <View className="items-center">
            <GrowDayLogo width={140} height={140} />
          </View>
  
          {/* Welcome */}
          <Text className="capitalize text-white text-center text-4xl font-redditsans-bold mb-4">
            Create your account!
          </Text>
  
          {/* GOOGLE LOGIN */}
          <TouchableOpacity
            className="flex-row justify-center bg-white rounded-full p-5 px-5 mb-6"
          >
            <GoogleIcon width={22} height={22} />
            <Text className="text-black text-lg font-redditsans-regular ml-4">
              CONTINUE WITH GOOGLE
            </Text>
          </TouchableOpacity>
  
         
  
          {/* Email input */}
            <View className=" flex-row gap-10">
  
              <TextInput
                placeholder="First Name"
                placeholderTextColor="#ddd"
                onChangeText={(text) => handleInputChange("firstName", text)}
                className="font-redditsans-medium w-48 bg-white rounded-xl p-5 px-4 mb-6 text-black"
                />


                <TextInput
                placeholder="Last Name"
                placeholderTextColor="#ddd"
                onChangeText={(text) => handleInputChange("lastName", text)}
                className="font-redditsans-medium w-48 bg-white rounded-xl mb-6 p-5 px-4 text-black"
              />
            </View>
            <View className="relative">
              <TextInput
                placeholder="Username"
                placeholderTextColor="#ddd"
                onChangeText={(text) => handleInputChange("username", text)}
                className="font-redditsans-medium bg-white rounded-xl mb-6 p-5 px-4 text-black"
              />
            </View>
            <View className="relative">
              <TextInput
                placeholder="Email"
                placeholderTextColor="#ddd"
                onChangeText={(text) => handleInputChange("email", text)}
                className="font-redditsans-medium bg-white rounded-xl mb-6 p-5 px-4 text-black"
              />
            </View>
            <View className="relative">
              <TextInput
                placeholder="Password"
                placeholderTextColor="#ddd"
                secureTextEntry={!showPassword}
                onChangeText={(text) => handleInputChange("password", text)}
                className="font-redditsans-medium bg-white rounded-xl mb-6 p-5 px-4 text-black"
              />

              <TouchableOpacity className="absolute top-5 right-4" onPress={() => setShowPassword(!showPassword)}>
              <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} size={20} color="#ddd" />
            </TouchableOpacity>
            
            </View>
  
            <View className="relative">
              <TextInput
                placeholder="Confirm Password"
                placeholderTextColor="#ddd"
                secureTextEntry={!showPassword}
                onChangeText={(text) => handleInputChange("confirmPassword", text)}
                className="font-redditsans-medium bg-white rounded-xl mb-6 p-5 px-4 text-black"
              />

              <TouchableOpacity className="absolute top-5 right-4" onPress={() => setShowPassword(!showPassword)}>
              <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} size={20} color="#ddd" />
            </TouchableOpacity>
            
            </View>
          {/* LOGIN BUTTON */}
          <TouchableOpacity className="bg-[#78C67E] p-5 rounded-full" onPress={handleRegister}>
            <Text className="text-white text-center font-redditsans-bold text-lg">
              Sign Up
            </Text>
          </TouchableOpacity>
  
          {/* SIGN UP LINK */}
          <View className="flex-row justify-center mt-6">
            <Text className="text-white font-redditsans-regular">Already have an account? </Text>
            <TouchableOpacity onPress={()=>navigation.navigate("Login")}>
              <Text className="text-white font-redditsans-bold">Sign In</Text>
            </TouchableOpacity>
          </View>
  
        </SafeAreaView>
      </LinearGradient>
    );
  };
  
  export default Register;
