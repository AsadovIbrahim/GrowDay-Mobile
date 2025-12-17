import { createNativeStackNavigator } from "@react-navigation/native-stack";
import UserPref1 from "../screens/preferences/UserPref1";
import UserPref2 from "../screens/preferences/UserPref2";
import UserPref3 from "../screens/preferences/UserPref3";
import UserPref4 from "../screens/preferences/UserPref4";
import UserPref5 from "../screens/preferences/UserPref5";

const Stack=createNativeStackNavigator();

const UserPreferencesStack=()=>{
    return(

        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="UserPref1" component={UserPref1} />
            <Stack.Screen name="UserPref2" component={UserPref2} />
            <Stack.Screen name="UserPref3" component={UserPref3} />
            <Stack.Screen name="UserPref4" component={UserPref4} />
            <Stack.Screen name="UserPref5" component={UserPref5} />
        </Stack.Navigator>
    )
}
export default UserPreferencesStack;