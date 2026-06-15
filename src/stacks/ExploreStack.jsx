import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Explore from "../screens/explore/Explore";
import ArticleDetailScreen from "../screens/explore/ArticleDetailScreen";
import UserTasks from "../screens/achievements/UserTasks";
import CreateCustomHabit from '../screens/create/CreateCustomHabit';
import MemoryGameScreen from '../screens/explore/MemoryGameScreen';
import GameLeaderboardScreen from '../screens/explore/GameLeaderboardScreen';
import SequenceGameScreen from '../screens/explore/SequenceGameScreen';
import StroopGameScreen from '../screens/explore/StroopGameScreen';
import ReactionGameScreen from '../screens/explore/ReactionGameScreen';
import SuggestedHabitsScreen from '../screens/explore/SuggestedHabitsScreen';

const Stack = createNativeStackNavigator();

const ExploreStack = () => {
    return(
        <Stack.Navigator screenOptions={{headerShown:false}}>
            <Stack.Screen name="Explore" component={Explore} />
            <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
            <Stack.Screen name="UserTasks" component={UserTasks} />
            <Stack.Screen name="CreateCustomHabit" component={CreateCustomHabit} />
            <Stack.Screen name="MemoryGame" component={MemoryGameScreen} />
            <Stack.Screen name="GameLeaderboard" component={GameLeaderboardScreen} />
            <Stack.Screen name="SequenceGame" component={SequenceGameScreen} />
            <Stack.Screen name="StroopGame" component={StroopGameScreen} />
            <Stack.Screen name="ReactionGame" component={ReactionGameScreen} />
            <Stack.Screen name="SuggestedHabits" component={SuggestedHabitsScreen} />
        </Stack.Navigator>
    )
}
export default ExploreStack;

