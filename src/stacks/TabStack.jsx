import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeStack from './HomeStack';
import ExploreStack from './ExploreStack';
import CreateStack from './CreateStack';
import AchievementsStack from './AchievementsStack';
import ProfileStack from './ProfileStack';
import TabBar from './components/TabBar';
const Tab = createBottomTabNavigator();

const TabStack = () => {
    return (
      <Tab.Navigator
        tabBar={
          ({ state , navigation  }) =>
            <TabBar
              state={state}
              navigation={navigation}
            />
        }
        screenOptions={{ headerShown: false }}>
        <Tab.Screen name='Home' component={HomeStack} />
        <Tab.Screen name='Explore' component={ExploreStack} />
        <Tab.Screen name='Create' component={CreateStack} />
        <Tab.Screen name='Achievements' component={AchievementsStack} />
        <Tab.Screen name='Profile' component={ProfileStack} />
      </Tab.Navigator>
    )
  }
  
export default TabStack;
