import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Profile from '../screens/profile/Profile';
import NotificationsSettings from '../screens/profile/NotificationsSettings';
import LanguageSettings from '../screens/profile/LanguageSettings';
import ChangePassword from '../screens/profile/ChangePassword';
import ContactSupport from '../screens/profile/ContactSupport';

const Stack = createNativeStackNavigator();

const ProfileStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Profile" component={Profile} />
            <Stack.Screen
                name="NotificationsSettings"
                component={NotificationsSettings}
                options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
                name="LanguageSettings"
                component={LanguageSettings}
                options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
                name="ChangePassword"
                component={ChangePassword}
                options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
                name="ContactSupport"
                component={ContactSupport}
                options={{ animation: 'slide_from_right' }}
            />
        </Stack.Navigator>
    );
};

export default ProfileStack;