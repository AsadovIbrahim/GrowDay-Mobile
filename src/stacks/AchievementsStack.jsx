import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Achievements from "../screens/achievements/Achievements";

const Stack = createNativeStackNavigator();

const AchievementsStack = () => {
    return(
        <Stack.Navigator screenOptions={{headerShown:false}}>
            <Stack.Screen name="Achievements" component={Achievements} />
        </Stack.Navigator>
    )
}
export default AchievementsStack;

