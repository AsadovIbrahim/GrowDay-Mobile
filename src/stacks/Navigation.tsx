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
import AnimatedSplashScreen from '../components/AnimatedSplashScreen';
import { requestUserPermission, getFcmToken, notificationListener, scheduleWinBackReminder, cancelWinBackReminder } from '../utils/NotificationService';
import notifee, { EventType } from '@notifee/react-native';
import BootSplash from 'react-native-bootsplash';

export const navigationRef = createNavigationContainerRef();

const Navigation = () => {
    const [accessToken] = useMMKVString('accessToken');
    const [isOnBoardingShown] = useMMKVBoolean("isOnBoardingShown");
    const [hasCompletedPreferences] = useMMKVBoolean("hasCompletedPreferences");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSplashVisible, setIsSplashVisible] = useState(true);
    const [isNavReady, setIsNavReady] = useState(false);

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
            } else if (type === EventType.ACTION_PRESS) {
                const habitId = detail.notification?.data?.habitId;
                if (habitId) {
                    const startKey = `timer_start_${habitId}`;
                    const accKey = `timer_acc_${habitId}`;
                    
                    if (detail.pressAction.id === 'stop') {
                        notifee.cancelNotification(detail.notification.id);
                        
                        // Import MMKV storage dynamically to avoid cyclic dependencies
                        import('../utils/MMKVStore').then(({ storage }) => {
                            const storedStart = storage.getString(startKey);
                            if (storedStart) {
                                const diff = Math.floor((new Date().getTime() - new Date(storedStart).getTime()) / 1000);
                                const currentAcc = parseInt(storage.getString(accKey) || '0', 10);
                                storage.set(accKey, (currentAcc + diff).toString());
                                storage.delete(startKey);
                            }
                            storage.set(`pending_stop_${habitId}`, true);
                        });
                    } else if (detail.pressAction.id === 'pause') {
                        import('../utils/MMKVStore').then(({ storage }) => {
                            const storedStart = storage.getString(startKey);
                            let newAcc = parseInt(storage.getString(accKey) || '0', 10);
                            if (storedStart) {
                                const diff = Math.floor((new Date().getTime() - new Date(storedStart).getTime()) / 1000);
                                newAcc += diff;
                                storage.set(accKey, newAcc.toString());
                                storage.delete(startKey);
                            }
                            
                            const baseSecs = parseInt(detail.notification.data?.baseSeconds || '0', 10);
                            const targetSecsStr = detail.notification.data?.targetSeconds;
                            const targetSecs = targetSecsStr ? parseInt(targetSecsStr, 10) : null;
                            const title = detail.notification.data?.title || '';
                            const distance = detail.notification.data?.distance || null;
                            import('../utils/NotificationService').then(({ displayOngoingHabitNotification, cancelGoalReachedNotification }) => {
                                displayOngoingHabitNotification({ id: habitId, title }, newAcc + baseSecs, distance, true, baseSecs, targetSecs);
                                cancelGoalReachedNotification(habitId);
                            });
                        });
                    } else if (detail.pressAction.id === 'resume') {
                        import('../utils/MMKVStore').then(({ storage }) => {
                            storage.set(startKey, new Date().toISOString());
                            
                            const currentAcc = parseInt(storage.getString(accKey) || '0', 10);
                            const baseSecs = parseInt(detail.notification.data?.baseSeconds || '0', 10);
                            const targetSecsStr = detail.notification.data?.targetSeconds;
                            const targetSecs = targetSecsStr ? parseInt(targetSecsStr, 10) : null;
                            const title = detail.notification.data?.title || '';
                            const distance = detail.notification.data?.distance || null;
                            import('../utils/NotificationService').then(({ displayOngoingHabitNotification, scheduleGoalReachedNotification }) => {
                                const totalCurrent = currentAcc + baseSecs;
                                displayOngoingHabitNotification({ id: habitId, title }, totalCurrent, distance, false, baseSecs, targetSecs);
                                
                                if (targetSecs !== null) {
                                    const remaining = targetSecs - totalCurrent;
                                    if (remaining > 0) {
                                        scheduleGoalReachedNotification({ id: habitId, title }, remaining);
                                    }
                                }
                            });
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
                <NavigationContainer ref={navigationRef} onReady={() => setIsNavReady(true)}>
                    {!accessToken ? (
                        <AuthStack initialRoute={isOnBoardingShown === true ? "Login" : "Onboarding"} />
                     ) : !hasCompletedPreferences ? (
                        <UserPreferencesStack />
                    ) : (
                        <TabStack />
                    )}
                    <CreateHabitBottomSheet />
                </NavigationContainer>
                {isNavReady && isSplashVisible && (
                    <AnimatedSplashScreen onAnimationEnd={() => setIsSplashVisible(false)} />
                )}
            </MenuContext.Provider>
        </ThemeProvider>
    );
};


export default Navigation;
