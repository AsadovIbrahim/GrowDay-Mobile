import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Explore from "../screens/explore/Explore";
import ArticleDetailScreen from "../screens/explore/ArticleDetailScreen";
import UserTasks from "../screens/achievements/UserTasks";
import CreateCustomHabit from '../screens/create/CreateCustomHabit';

const Stack = createNativeStackNavigator();

const ExploreStack = () => {
    return(
        <Stack.Navigator screenOptions={{headerShown:false}}>
            <Stack.Screen name="Explore" component={Explore} />
            <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
            <Stack.Screen name="UserTasks" component={UserTasks} />
            <Stack.Screen name="CreateCustomHabit" component={CreateCustomHabit} />
        </Stack.Navigator>
    )
}
export default ExploreStack;

