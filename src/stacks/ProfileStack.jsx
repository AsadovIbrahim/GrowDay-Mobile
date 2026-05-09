import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Profile from '../screens/profile/Profile';
import NotificationsSettings from '../screens/profile/NotificationsSettings';
import LanguageSettings from '../screens/profile/LanguageSettings';
import ChangePassword from '../screens/profile/ChangePassword';
import ContactSupport from '../screens/profile/ContactSupport';
import EditProfile from '../screens/profile/EditProfile';
import PrivacyPolicy from '../screens/profile/PrivacyPolicy';
import TermsOfService from '../screens/profile/TermsOfService';
import UserPref0 from '../screens/preferences/UserPref0';
import UserPref1 from '../screens/preferences/UserPref1';
import UserPref2 from '../screens/preferences/UserPref2';
import UserPref3 from '../screens/preferences/UserPref3';
import UserPref4 from '../screens/preferences/UserPref4';
import UserPref5 from '../screens/preferences/UserPref5';
import UserPref6 from '../screens/preferences/UserPref6';
import UserPref7 from '../screens/preferences/UserPref7';

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
            <Stack.Screen
                name="EditProfile"
                component={EditProfile}
                options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
                name="PrivacyPolicy"
                component={PrivacyPolicy}
                options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
                name="TermsOfService"
                component={TermsOfService}
                options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen name="UserPref0" component={UserPref0} />
            <Stack.Screen name="UserPref1" component={UserPref1} />
            <Stack.Screen name="UserPref2" component={UserPref2} />
            <Stack.Screen name="UserPref3" component={UserPref3} />
            <Stack.Screen name="UserPref4" component={UserPref4} />
            <Stack.Screen name="UserPref5" component={UserPref5} />
            <Stack.Screen name="UserPref6" component={UserPref6} />
            <Stack.Screen name="UserPref7" component={UserPref7} />
        </Stack.Navigator>
    );
};

export default ProfileStack;