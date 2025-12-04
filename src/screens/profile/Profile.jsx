import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { storage } from "../../utils/MMKVStore";

const Profile = () => {

    const handleLogOut=()=>{
        storage.delete("accessToken");
    }
    return(
        <>
        <View className="flex-1">
            <TouchableOpacity onPress={handleLogOut} className="bg-slate-600 w-24">
                <Text className="text-white">Logout</Text>
            </TouchableOpacity>
        </View>
        </>
    )
}
export default Profile;