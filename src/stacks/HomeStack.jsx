import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from "../screens/home/Home"
import Notification from "../screens/notifications/Notification";
import NotificationDetail from "../screens/notifications/NotificationDetail";

const Stack = createNativeStackNavigator();

const HomeStack = () => {
    return(
        <Stack.Navigator screenOptions={{headerShown:false}}>
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="Notification" component={Notification} />
            <Stack.Screen name="NotificationDetail" component={NotificationDetail} />
        </Stack.Navigator>
    )
}
export default HomeStack;