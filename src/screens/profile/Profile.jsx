import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Switch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { storage } from "../../utils/MMKVStore";
import LinearGradient from "react-native-linear-gradient";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { getUserTotalPoints } from "../../utils/fetch";
import { 
    faMedal, 
    faMoon, 
    faBell, 
    faGlobe, 
    faMobileAlt, 
    faLock, 
    faFileAlt, 
    faScaleBalanced, 
    faComment, 
    faStar, 
    faChevronRight 
} from "@fortawesome/free-solid-svg-icons";

const MenuItem = ({ icon, title, isToggle, value, onToggle, onPress, hideBorder }) => {
    return (
        <TouchableOpacity 
            onPress={onPress} 
            disabled={isToggle}
            className={`flex-row items-center py-4 px-4 ${!hideBorder ? 'border-b border-gray-100' : ''}`}
        >
            <View className="w-6 items-center">
                <FontAwesomeIcon icon={icon} size={20} color="#111827" />
            </View>
            <Text className="flex-1 ml-4 text-gray-900 text-base font-medium">{title}</Text>
            {isToggle ? (
                <Switch 
                    value={value} 
                    onValueChange={onToggle} 
                    trackColor={{ false: "#d1d5db", true: "#34d399" }}
                    thumbColor={"#ffffff"}
                />
            ) : (
                <FontAwesomeIcon icon={faChevronRight} size={14} color="#9ca3af" />
            )}
        </TouchableOpacity>
    );
};

const Profile = () => {
    const insets = useSafeAreaInsets();
    const [isDarkMode, setIsDarkMode] = useState(false);

    const [points, setPoints] = useState(0);

    const handleLogOut = () => {
        storage.delete("accessToken");
    };
    const fetchPoints = async () => {
            try {
                const token = storage.getString("accessToken");
                const userPoints = await getUserTotalPoints(token);
                console.log(userPoints)
                setPoints(userPoints.data);
            } catch (error) {
                console.error("Failed to fetch points", error);
            }
        };

    useEffect(() => {
        fetchPoints();
    }, []);

    return (
        <LinearGradient colors={["#e7f0df", "#2f6f3f"]} className="flex-1">
            <ScrollView 
                className="flex-1 px-4"
                contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                <Text className="text-2xl font-redditsans-bold text-black mb-6">Your Profile</Text>

                <View className="bg-white rounded-3xl p-5 mb-8 flex-row items-center justify-between shadow-sm">
                    <View>
                        <Text className="text-xl font-redditsans-bold text-black mb-2">Ibrahim Asadov</Text>
                        <View className="bg-[#fff4e6] px-3 py-1.5 rounded-full flex-row items-center self-start">
                            <FontAwesomeIcon icon={faMedal} size={16} color="#f5a623" />
                            <Text className="text-[#f5a623] font-redditsans-bold ml-1 text-sm">{points} Points</Text>
                        </View>
                    </View>
                    <TouchableOpacity className="bg-gray-200 px-4 py-2 rounded-xl">
                        <Text className="text-gray-800 font-redditsans-bold text-sm">Edit Profile</Text>
                    </TouchableOpacity>
                </View>

                <Text className="text-gray-800 ml-2 mb-2 text-sm font-redditsans-bold">General</Text>
                <View className="bg-white rounded-3xl overflow-hidden mb-6 shadow-sm">
                    <MenuItem icon={faMoon} title="Dark Mode" isToggle={true} value={isDarkMode} onToggle={setIsDarkMode} />
                    <MenuItem icon={faBell} title="Notifications" />
                    <MenuItem icon={faGlobe} title="Languages" />
                    <MenuItem icon={faMobileAlt} title="App Version" hideBorder={true} />
                </View>

                <Text className="text-gray-800 ml-2 mb-2 text-sm font-redditsans-bold">Privacy</Text>
                <View className="bg-white rounded-3xl overflow-hidden mb-6 shadow-sm">
                    <MenuItem icon={faLock} title="Change Password" />
                    <MenuItem icon={faFileAlt} title="Privacy Policy" />
                    <MenuItem icon={faScaleBalanced} title="Terms of Service" hideBorder={true} />
                </View>

                <Text className="text-gray-800 ml-2 mb-2 text-sm font-redditsans-bold">Support</Text>
                <View className="bg-white rounded-3xl overflow-hidden mb-6 shadow-sm">
                    <MenuItem icon={faComment} title="Contact Support" />
                    <MenuItem icon={faStar} title="Rate The App" hideBorder={true} />
                </View>

                <TouchableOpacity 
                    onPress={handleLogOut} 
                    className="bg-white rounded-3xl p-4 flex-row items-center justify-center mt-2 mb-10 shadow-sm border border-red-100"
                >
                    <Text className="text-red-500 font-redditsans-bold text-lg">Logout</Text>
                </TouchableOpacity>
            </ScrollView>
        </LinearGradient>  
    );
};

export default Profile;