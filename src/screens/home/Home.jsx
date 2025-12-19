import { View, Text } from "react-native";
import LinearGradient from "react-native-linear-gradient";

const Home = () => {
    
    return(
        
        <LinearGradient
            colors={["#e7f0df", "#2f6f3f"]}
           
            className="flex-1"
        >
            <View className="flex-1">
                <Text>Home</Text>
            </View>

        </LinearGradient>
        
    )
}
export default Home;