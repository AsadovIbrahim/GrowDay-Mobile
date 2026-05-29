import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from "../screens/home/Home"
import Notification from "../screens/notifications/Notification";
import NotificationDetail from "../screens/notifications/NotificationDetail";
import UserHabits from "../screens/home/UserHabits";
import UserHabitDetails from "../screens/home/UserHabitDetails";
import HabitCelebration from "../screens/home/HabitCelebration";
import CreateCustomHabit from "../screens/create/CreateCustomHabit";
import HabitHistory from "../screens/home/HabitHistory";
import Statistics from "../screens/statistics/Statistics";
import AIMentorChatScreen from "../screens/home/AIMentorChatScreen";

const Stack = createNativeStackNavigator();


const HomeStack = () => {
    return(
        <Stack.Navigator screenOptions={{headerShown:false}}>
            <Stack.Screen name="HomeScreen" component={Home} />
            <Stack.Screen name="Notification" component={Notification} />
            <Stack.Screen name="NotificationDetail" component={NotificationDetail} />
            <Stack.Screen name="UserHabits" component={UserHabits} />
            <Stack.Screen name="UserHabitDetails" component={UserHabitDetails} />
            <Stack.Screen name="HabitCelebration" component={HabitCelebration} options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
            <Stack.Screen name="CreateCustomHabit" component={CreateCustomHabit} />
            <Stack.Screen name="HabitHistory" component={HabitHistory} />
            <Stack.Screen name="Statistics" component={Statistics} />
            <Stack.Screen name="AIMentorChat" component={AIMentorChatScreen} />

        </Stack.Navigator>
    )
}
export default HomeStack;