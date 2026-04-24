import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Explore from "../screens/explore/Explore";
import UserTasks from "../screens/achievements/UserTasks";

const Stack = createNativeStackNavigator();

const ExploreStack = () => {
    return(
        <Stack.Navigator screenOptions={{headerShown:false}}>
            <Stack.Screen name="Explore" component={Explore} />
            <Stack.Screen name="UserTasks" component={UserTasks} />
        </Stack.Navigator>
    )
}
export default ExploreStack;

