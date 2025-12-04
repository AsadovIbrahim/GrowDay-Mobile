import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeStack from './HomeStack';
import ProfileStack from './ProfileStack'
import TabBar from './components/TabBar'

const Tab = createBottomTabNavigator();

const TabStack = () => {
    return (
      <Tab.Navigator
        tabBar={
          ({ state , navigation }) =>
            <TabBar
              state={state}
              navigation={navigation}
            />
        }
        screenOptions={{ headerShown: false }}>
        <Tab.Screen name='Home' component={HomeStack} />
        <Tab.Screen name='Profile' component={ProfileStack} />

      </Tab.Navigator>
    )
  }
  
export default TabStack;
