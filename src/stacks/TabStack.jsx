import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { useMMKVBoolean, useMMKVString } from 'react-native-mmkv';
import React, { useEffect } from 'react';
import HomeStack from './HomeStack';
import ExploreStack from './ExploreStack';
import AchievementsStack from './AchievementsStack';
import ProfileStack from './ProfileStack';
import TabBar from './components/TabBar';
const Tab = createBottomTabNavigator();

const TabStack = () => {
  const [checklistCompleted] = useMMKVString("user.onboarding_checklist_completed");
  const [checklistSkipped] = useMMKVBoolean("user.onboarding_checklist_skipped");

  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={({ state, navigation }) => {
        if (checklistCompleted !== "true" && checklistSkipped !== true) {
          return null;
        }

        const route = state.routes[state.index];
        const routeName = getFocusedRouteNameFromRoute(route);

        const hideOnScreens = [
          "UserPref0", "UserPref1", "UserPref2", "UserPref3", "UserPref4", "UserPref5", "UserPref6", "UserPref7",
          "HabitCelebration", "MemoryGame", "SequenceGame", "StroopGame", "GameLeaderboard", "ReactionGame", "AIMentorChat",
          "Notification", "NotificationDetail", "NotificationsSettings", "LanguageSettings", "ChangePassword", "ContactSupport"
        ];

        if (hideOnScreens.includes(routeName)) {
          return null;
        }

        return (
          <TabBar
            state={state}
            navigation={navigation}
          />
        );
      }}
      screenOptions={{ headerShown: false }}>
      <Tab.Screen name='Home' component={HomeStack} />
      <Tab.Screen name='Explore' component={ExploreStack} />
      <Tab.Screen name='Achievements' component={AchievementsStack} />
      <Tab.Screen name='Profile' component={ProfileStack} />
    </Tab.Navigator>
  )
}

export default TabStack;
