import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { useMMKVString, useMMKVBoolean } from 'react-native-mmkv';
import TabStack from "./TabStack";
import AuthStack from './AuthStack';
import UserPreferencesStack from './UserPreferencesStack';
import { MenuContext } from '../context/MenuContext';
import { ThemeProvider } from '../context/ThemeContext';
import { useState, useEffect, useRef } from 'react';
import { AppState, Alert } from 'react-native';
import CreateHabitBottomSheet from '../components/CreateHabitBottomSheet';
import { requestUserPermission, getFcmToken, notificationListener, scheduleWinBackReminder, cancelWinBackReminder } from '../utils/NotificationService';
import notifee, { EventType } from '@notifee/react-native';

export const navigationRef = createNavigationContainerRef();

const Navigation = () => {
    const [accessToken] = useMMKVString('accessToken');
    const [isOnBoardingShown] = useMMKVBoolean("isOnBoardingShown");
    const [hasCompletedPreferences] = useMMKVBoolean("hasCompletedPreferences");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        let unsubscribe = () => {};

        if (accessToken) {
            const setupNotifications = async () => {
                const hasPermission = await requestUserPermission();
                if (hasPermission) {
                    await getFcmToken(accessToken);
                    unsubscribe = await notificationListener();
                }
            };
            setupNotifications();
        }

        return () => {
            unsubscribe();
        };
    }, [accessToken]);

    // Handle AppState changes for Win-Back Campaign
    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                // User opened the app, cancel the 7-day timer
                cancelWinBackReminder();
            } else if (nextAppState === 'background' || nextAppState === 'inactive') {
                // User closed the app, schedule the 7-day timer
                scheduleWinBackReminder();
            }
        });

        // Also cancel it right away when the app first loads
        cancelWinBackReminder();

        return () => {
            subscription.remove();
        };
    }, []);

    // Handle Deep Linking from Notifee (Ongoing Habits & Reminders)
    useEffect(() => {
        // Handle when app is opened from quit state
        const handleInitialNotification = async () => {
            const initialNotification = await notifee.getInitialNotification();
            
            if (initialNotification?.notification?.data?.type === 'winback') {
                setTimeout(() => {
                    Alert.alert("Welcome back! 🎉", "We missed you! Let's crush your goals today.");
                }, 1000);
            } else if (initialNotification?.notification?.data?.habitId) {
                const habitId = initialNotification.notification.data.habitId;
                setTimeout(() => {
                    if (navigationRef.isReady()) {
                        navigationRef.navigate('Home', { 
                            screen: 'UserHabitDetails', 
                            params: { habitId: habitId } 
                        });
                    }
                }, 500);
            }
        };
        handleInitialNotification();

        // Handle when app is opened from background state
        const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
            if (type === EventType.PRESS) {
                if (detail.notification?.data?.type === 'winback') {
                    Alert.alert("Welcome back! 🎉", "We missed you! Let's crush your goals today.");
                } else if (detail.notification?.data?.habitId) {
                    const habitId = detail.notification.data.habitId;
                    if (navigationRef.isReady()) {
                        navigationRef.navigate('Home', { 
                            screen: 'UserHabitDetails', 
                            params: { habitId: habitId } 
                        });
                    }
                }
            }
        });

        return () => unsubscribeNotifee();
    }, []);
    
    return (
        <ThemeProvider>
            <MenuContext.Provider value={{ 
                isMenuOpen, 
                setIsMenuOpen, 
                isCreateModalOpen, 
                setIsCreateModalOpen 
            }}>
                <NavigationContainer ref={navigationRef}>
                    {!accessToken ? (
                        <AuthStack initialRoute={isOnBoardingShown === true ? "Login" : "Onboarding"} />
                     ) : !hasCompletedPreferences ? (
                        <UserPreferencesStack />
                    ) : (
                        <TabStack />
                    )}
                    <CreateHabitBottomSheet />
                </NavigationContainer>
            </MenuContext.Provider>
        </ThemeProvider>
    );
};


export default Navigation;
