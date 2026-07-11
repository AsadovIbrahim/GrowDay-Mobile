import { NavigationContainer, createNavigationContainerRef, DefaultTheme } from '@react-navigation/native';
import { useMMKVString, useMMKVBoolean } from 'react-native-mmkv';
import TabStack from "./TabStack";
import AuthStack from './AuthStack';
import UserPreferencesStack from './UserPreferencesStack';
import { MenuContext } from '../context/MenuContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { useState, useEffect, useRef } from 'react';
import { AppState, Alert, BackHandler, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CreateHabitBottomSheet from '../components/CreateHabitBottomSheet';
import AnimatedSplashScreen from '../components/AnimatedSplashScreen';
import { requestUserPermission, getFcmToken, notificationListener, scheduleWinBackReminder, cancelWinBackReminder, scheduleDailyMotivationalQuotes } from '../utils/NotificationService';
import notifee, { EventType } from '@notifee/react-native';
import BootSplash from 'react-native-bootsplash';
import { storage } from '../utils/MMKVStore';
import LevelUpModal from '../components/LevelUpModal';
import mobileAds from 'react-native-google-mobile-ads';

export const navigationRef = createNavigationContainerRef();

const AppNavigator = () => {
    const [accessToken] = useMMKVString('accessToken');
    const [isOnBoardingShown] = useMMKVBoolean("isOnBoardingShown");
    const [hasCompletedPreferences] = useMMKVBoolean("hasCompletedPreferences");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSplashVisible, setIsSplashVisible] = useState(true);
    const [isNavReady, setIsNavReady] = useState(false);
    const [pendingLevelUp, setPendingLevelUp] = useState(0);

    const { theme, isDark } = useTheme();
    const { colors } = theme;

    const navTheme = {
        dark: isDark,
        colors: {
            primary: colors.primary,
            background: colors.background,
            card: colors.card,
            text: colors.text,
            border: colors.border,
            notification: colors.danger,
        },
        fonts: DefaultTheme.fonts,
    };

    useEffect(() => {
        mobileAds()
            .initialize()
            .then(adapterStatuses => {
                console.log('Mobile Ads SDK initialized successfully!', adapterStatuses);
            })
            .catch(err => {
                console.log('Mobile Ads SDK initialization failed:', err);
            });
    }, []);

    useEffect(() => {
        const checkPendingLevel = () => {
            const pending = storage.getNumber('user.pendingLevelUp') || 0;
            if (pending > 0 && pending !== pendingLevelUp) {
                setPendingLevelUp(pending);
            }
        };
        checkPendingLevel();

        const interval = setInterval(checkPendingLevel, 800);
        return () => clearInterval(interval);
    }, [pendingLevelUp]);

    const handleCloseLevelUp = () => {
        setPendingLevelUp(0);
        storage.delete('user.pendingLevelUp');
    };

    useEffect(() => {
        let unsubscribe = () => { };

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
        scheduleDailyMotivationalQuotes();

        return () => {
            subscription.remove();
        };
    }, []);

    // Handle Android physical back button presses globally
    useEffect(() => {
        const onBackPress = () => {
            if (navigationRef.isReady() && navigationRef.canGoBack()) {
                navigationRef.goBack();
                return true;
            }
            return false;
        };

        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

        return () => subscription.remove();
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
                const dateStr = detail.notification?.data?.dateStr || '';
                if (habitId) {
                    const dateSuffix = dateStr ? `_${dateStr}` : '';
                    const startKey = `timer_start_${habitId}${dateSuffix}`;
                    const accKey = `timer_acc_${habitId}${dateSuffix}`;

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
                            storage.set(`pending_stop_${habitId}${dateSuffix}`, true);
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
                                displayOngoingHabitNotification({ id: habitId, title }, newAcc + baseSecs, distance, true, baseSecs, targetSecs, dateStr);
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
                                displayOngoingHabitNotification({ id: habitId, title }, totalCurrent, distance, false, baseSecs, targetSecs, dateStr);

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
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor="transparent"
                translucent={true}
            />
            <MenuContext.Provider value={{
                isMenuOpen,
                setIsMenuOpen,
                isCreateModalOpen,
                setIsCreateModalOpen
            }}>
                <NavigationContainer ref={navigationRef} theme={navTheme} onReady={() => setIsNavReady(true)}>
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
                    <AnimatedSplashScreen onAnimationEnd={() => {
                        setIsSplashVisible(false);
                        storage.set("app.is_splash_finished", true);
                    }} />
                )}
                <LevelUpModal
                    visible={pendingLevelUp > 0}
                    level={pendingLevelUp}
                    onClose={handleCloseLevelUp}
                />
            </MenuContext.Provider>
        </SafeAreaView>
    );
};

const Navigation = () => {
    return (
        <ThemeProvider>
            <AppNavigator />
        </ThemeProvider>
    );
};


export default Navigation;
